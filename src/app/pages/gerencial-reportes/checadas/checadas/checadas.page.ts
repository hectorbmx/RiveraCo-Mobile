import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline,
  constructOutline,
  cubeOutline,
  hardwareChipOutline,
  homeOutline,
  peopleOutline,
  personOutline,
  searchOutline,
  shieldCheckmark,
} from 'ionicons/icons';
import { AttendanceService } from 'src/app/services/attendance.service';

export interface Worker {
  id: number; // attendance_user.id
  name: string;
  role: string;
  initials: string;
  avatarClass: string;
  dayLabel: string;
  clockIn: string;
  clockOut: string | null;
}

@Component({
  selector: 'app-checadas',
  templateUrl: './checadas.page.html',
  styleUrls: ['./checadas.page.scss'],
  standalone: true,
  imports: [
    IonTitle,IonButtons,
    IonToolbar,
    IonContent,
    IonHeader,
    IonIcon,
    IonLabel,
    IonTabBar,
    IonTabButton,
    CommonModule,
    FormsModule,
  ],
})
export class ChecadasPage implements OnInit {

  searchQuery = '';
  currentDate = new Date();

  loading = false;

  allWorkers: Worker[] = [];

  private rawResponse: any = null;

  get filteredWorkers(): Worker[] {
    const q = this.searchQuery.trim().toLowerCase();

    if (!q) {
      return this.allWorkers;
    }

    return this.allWorkers.filter((w) =>
      w.name.toLowerCase().includes(q) ||
      w.role.toLowerCase().includes(q)
    );
  }

  get currentDateLabel(): string {
    return this.currentDate.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }

  get onSiteCount(): number {
    return this.allWorkers.filter((w) => !w.clockOut).length;
  }

  get totalHours(): string {
    const total = this.allWorkers.reduce((sum, worker) => {
      if (!worker.clockIn || !worker.clockOut) {
        return sum;
      }

      const inMinutes = this.timeToMinutes(worker.clockIn);
      const outMinutes = this.timeToMinutes(worker.clockOut);

      if (inMinutes === null || outMinutes === null || outMinutes < inMinutes) {
        return sum;
      }

      return sum + ((outMinutes - inMinutes) / 60);
    }, 0);

    return total.toFixed(1);
  }

  get avgClockIn(): string {
    const validWorkers = this.allWorkers.filter((w) => !!w.clockIn);

    if (!validWorkers.length) {
      return '--:--';
    }

    const totalMinutes = validWorkers.reduce((sum, worker) => {
      const minutes = this.timeToMinutes(worker.clockIn);
      return sum + (minutes ?? 0);
    }, 0);

    const avg = Math.round(totalMinutes / validWorkers.length);
    return this.minutesToTime(avg);
  }

  constructor(
    private router: Router,
    private attendanceService: AttendanceService
  ) {
    addIcons({searchOutline,chevronBackOutline,calendarOutline,chevronForwardOutline,shieldCheckmark,personOutline,homeOutline,constructOutline,hardwareChipOutline,peopleOutline,cubeOutline,});
  }

  ngOnInit() {
     console.log('🚀 ChecadasPage INIT');
  console.log('📅 Fecha actual:', this.currentDate);
    this.loadAttendance(this.currentDate);
 
  }

  prevDay() {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() - 1);
    this.currentDate = d;
    this.loadAttendance(this.currentDate);
  }

  nextDay() {
    const d = new Date(this.currentDate);
    d.setDate(d.getDate() + 1);
    this.currentDate = d;
    this.loadAttendance(this.currentDate);
  }

  goToHistory(worker: Worker) {
    this.router.navigate(
      ['/tabs-gerencial/gerencial-reportes/checadas', worker.id],
      {
        state: {
          workerName: worker.name,
          selectedDate: this.formatDateOnly(this.currentDate),
        }
      }
    );
  }

  private loadAttendance(date: Date) {
  const iso = this.formatDateOnly(date);

  console.log('📡 Llamando endpoint con fecha:', iso);

  this.loading = true;

  this.attendanceService.getLogs({
    from: iso,
    to: iso,
    per_page: 300
  }).subscribe({
    next: (response: any) => {
      console.log('✅ RESPONSE:', response);

      this.rawResponse = response;
      this.allWorkers = this.mapLogsToWorkers(response?.data ?? []);

      console.log('👷 Workers mapeados:', this.allWorkers);

      this.loading = false;
    },
    error: (error) => {
      console.error('❌ ERROR EN API:', error);
      this.allWorkers = [];
      this.loading = false;
    }
  });
}

  private mapLogsToWorkers(logs: any[]): Worker[] {
    const grouped = new Map<string, any[]>();

    for (const log of logs) {
      const userId = log?.user?.id;
      const name = log?.user?.name;

      if (!userId || !name) {
        continue;
      }

      const key = String(userId);

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)?.push(log);
    }

    return Array.from(grouped.values())
      .map((employeeLogs) => this.buildWorkerFromLogs(employeeLogs))
      .filter((worker): worker is Worker => worker !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private buildWorkerFromLogs(employeeLogs: any[]): Worker | null {
    if (!employeeLogs.length) {
      return null;
    }
    

    const sorted = [...employeeLogs].sort((a, b) => {
      const aTime = new Date(a.checked_at).getTime();
      const bTime = new Date(b.checked_at).getTime();
      return aTime - bTime;
    });

    const firstLog = sorted[0];
    const lastLog = sorted[sorted.length - 1];

    const user = firstLog.user;

    if (!user?.id || !user?.name) {
      return null;
    }

    // const firstDate = new Date(firstLog.checked_at);
    // const lastDate = new Date(lastLog.checked_at);
    const firstDate = new Date(firstLog.checked_at.replace('Z', ''));
    const lastDate = new Date(lastLog.checked_at.replace('Z', ''));

    const clockIn = this.formatTime(firstDate);
    const clockOut = sorted.length >= 2 ? this.formatTime(lastDate) : null;

    return {
      id: user.id,
      name: user.name,
      role: 'Sin puesto',
      initials: this.getInitials(user.name),
      avatarClass: this.getAvatarClass(user.id),
      dayLabel: firstDate.toLocaleDateString('es-MX', { weekday: 'short' }),
      clockIn,
      clockOut,
    };
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  private getAvatarClass(userId: number): string {
    const classes = ['av-navy', 'av-light', 'av-blue', 'av-yellow', 'av-teal'];
    return classes[userId % classes.length];
  }

  private timeToMinutes(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const parts = value.split(':');
    if (parts.length < 2) {
      return null;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return (hours * 60) + minutes;
  }

  private minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}