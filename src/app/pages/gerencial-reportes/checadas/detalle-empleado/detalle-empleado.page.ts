import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
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
  shieldCheckmark
} from 'ionicons/icons';
import { AttendanceService } from 'src/app/services/attendance.service';

@Component({
  selector: 'app-detalle-empleado',
  templateUrl: './detalle-empleado.page.html',
  styleUrls: ['./detalle-empleado.page.scss'],
  standalone: true,
  imports: [IonIcon, IonList, IonItem, IonLabel, 
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    CommonModule,
    FormsModule
  ]
})
export class DetalleEmpleadoPage implements OnInit {

  employeeId: number | null = null;
  employeeName = 'Empleado';
  selectedDate = this.formatDateOnly(new Date());

  loading = false;
  errorMessage = '';

  employee: any = null;
  filters: any = null;
  kpis: any = null;
  rows: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router, 
    private attendanceService: AttendanceService
  ) {
    addIcons({
      searchOutline,
      chevronBackOutline,
      calendarOutline,
      chevronForwardOutline,
      shieldCheckmark,
      personOutline,
      homeOutline,
      constructOutline,
      hardwareChipOutline,
      peopleOutline,
      cubeOutline,
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const state = history.state;

    console.log('🧭 detalle-empleado init');
    console.log('📌 route id:', idParam);
    console.log('📦 state:', state);

    this.employeeId = idParam ? Number(idParam) : null;

    if (state?.workerName) {
      this.employeeName = state.workerName;
    }

    if (state?.selectedDate) {
      this.selectedDate = state.selectedDate;
    }

    if (!this.employeeId || Number.isNaN(this.employeeId)) {
      this.errorMessage = 'No se recibió un empleado válido.';
      return;
    }

    this.loadSummary();
  }
loadSummary() {
  if (!this.employeeId) return;

  this.loading = true;
  this.errorMessage = '';

  this.attendanceService.getEmployeeSummary(this.employeeId).subscribe({
    next: (res) => {
      if (res.ok) {
        // Mapeamos cada parte del JSON a tus variables locales
        this.employee = res.employee;
        this.filters = res.filters;
        this.kpis = res.kpis;
        this.rows = res.data; // 'data' del JSON son las filas (rows)
        
        // Si el nombre no venía en el 'state', lo tomamos del objeto employee
        if (!this.employeeName || this.employeeName === 'Empleado') {
          this.employeeName = res.employee.name;
        }
      }
      this.loading = false;
    },
    error: (err) => {
      console.error('❌ Error al obtener resumen:', err);
      this.errorMessage = 'No se pudo cargar la información del empleado.';
      this.loading = false;
    }
  });
}

// Asegúrate de tener esta función para inicializar selectedDate si no viene en state

  prevDay() {
    const d = new Date(this.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    this.selectedDate = this.formatDateOnly(d);
    this.loadSummary();
  }

  nextDay() {
    const d = new Date(this.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    this.selectedDate = this.formatDateOnly(d);
    this.loadSummary();
  }

  get selectedDateLabel(): string {
    const d = new Date(this.selectedDate + 'T00:00:00');
    return d.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  get workedDays(): number {
    return this.kpis?.worked_days ?? 0;
  }

  get totalHours(): string {
    const value = this.kpis?.total_hours;
    return value !== null && value !== undefined ? String(value) : '0';
  }

  get avgEntry(): string {
    return this.kpis?.avg_entry ?? '--:--';
  }

  get firstRow(): any | null {
    return this.rows.length ? this.rows[0] : null;
  }

  get logsOfDay(): any[] {
    return this.firstRow?.logs ?? [];
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  formatTime(dateStr: string | null): string {
  if (!dateStr) return '--:--';
  // El API manda "YYYY-MM-DD HH:mm:ss", tomamos solo la parte de la hora
  const parts = dateStr.split(' ');
  if (parts.length < 2) return '--:--';
  return parts[1].substring(0, 5); // Retorna "HH:mm"
}

getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}
regresar() {
  
  this.router.navigate(['/tabs-gerencial/reportes/checadas']);
}
}