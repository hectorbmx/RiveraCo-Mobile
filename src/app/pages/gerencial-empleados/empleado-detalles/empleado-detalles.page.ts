import { DestroyRef as RefreshDestroyRef, inject as refreshInject } from '@angular/core';
import type { RefresherCustomEvent } from '@ionic/core';
import { RefrescoConsultaService } from 'src/app/services/refresco-consulta.service';
import { IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  briefcaseOutline,
  businessOutline,
  calendarOutline,
  call,
  checkmarkCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeCircleOutline,
  constructOutline,
  mailOutline,
  personCircle,
  personOutline,
  phonePortraitOutline,
  timeOutline,
} from 'ionicons/icons';
import { ProfileMenuComponent } from 'src/app/components/profile-menu/profile-menu.component';
import { GerencialPersonalService } from 'src/app/services/gerencial-personal.service';

@Component({
  selector: 'app-empleado-detalles',
  templateUrl: './empleado-detalles.page.html',
  styleUrls: ['./empleado-detalles.page.scss'],
  standalone: true,
  imports: [IonRefresher, IonRefresherContent,
    IonContent, IonHeader, IonTitle, IonItem, CommonModule, FormsModule,
    IonButton, IonBackButton, IonButtons, IonLabel, IonList, IonIcon,
    IonBadge, IonCard, ProfileMenuComponent
  ]
})
export class EmpleadoDetallesPage implements OnInit {
  private refrescoApp = refreshInject(RefrescoConsultaService);
  private destroyRefrescoApp = refreshInject(RefreshDestroyRef);
  refrescarApp(event: RefresherCustomEvent) {
    if (this.loading) { void event.target.complete(); return; }
    this.refrescoApp.ejecutar(event, completar => { this.obtenerDetalle(completar); }, this.destroyRefrescoApp);
  }

  id: string | null = null;
  empleado: any = null;
  asistenciaSemana: any = null;
  weekStart = '';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private personalSvc: GerencialPersonalService
  ) {
    addIcons({
      alertCircleOutline,
      briefcaseOutline,
      businessOutline,
      calendarOutline,
      call,
      checkmarkCircleOutline,
      chevronBackOutline,
      chevronForwardOutline,
      closeCircleOutline,
      constructOutline,
      mailOutline,
      personCircle,
      personOutline,
      phonePortraitOutline,
      timeOutline,
    });
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    this.weekStart = this.toDateInput(this.startOfWeek(new Date()));

    if (this.id) {
      this.obtenerDetalle();
    }
  }

  obtenerDetalle(_completado: () => void = () => {}) {
    this.loading = true;
    this.personalSvc.getEmpleado(this.id!, this.weekStart).pipe(finalize(_completado)).subscribe({
      next: (res) => {
        this.empleado = res.data;
        this.asistenciaSemana = this.empleado?.asistencia_semana ?? null;
        this.loading = false;
        console.log('Datos del empleado:', this.empleado);
      },
      error: (err) => {
        console.error('Error al cargar el detalle:', err);
        this.loading = false;
      }
    });
  }

  semanaAnterior() {
    this.moverSemana(-7);
  }

  semanaSiguiente() {
    this.moverSemana(7);
  }

  semanaActual() {
    const semanaActual = this.toDateInput(this.startOfWeek(new Date()));

    if (this.weekStart !== semanaActual) {
      this.weekStart = semanaActual;
      this.obtenerDetalle();
    }
  }

  puedeAvanzarSemana(): boolean {
    return this.weekStart < this.toDateInput(this.startOfWeek(new Date()));
  }

  estadoDiaClase(status: string | null | undefined): string {
    return `attendance-${status || 'sin_entrada'}`;
  }

  iconoDia(status: string | null | undefined): string {
    if (status === 'completa') {
      return 'checkmark-circle-outline';
    }

    if (status === 'entrada_sin_foto') {
      return 'alert-circle-outline';
    }

    return 'close-circle-outline';
  }

  textoDia(status: string | null | undefined): string {
    const labels: Record<string, string> = {
      completa: 'Completa',
      entrada_sin_foto: 'Sin foto',
      sin_entrada: 'Sin entrada',
    };

    return labels[status || 'sin_entrada'] || 'Sin entrada';
  }

  formatDateText(value: string | null | undefined): string {
    if (!value) {
      return '--/--';
    }

    const [year, month, day] = value.split('-');

    return year && month && day ? `${day}/${month}/${year}` : value;
  }
  private moverSemana(days: number) {
    const base = this.parseDateInput(this.weekStart) || this.startOfWeek(new Date());
    base.setDate(base.getDate() + days);
    this.weekStart = this.toDateInput(base);
    this.obtenerDetalle();
  }

  private startOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }

  private parseDateInput(value: string): Date | null {
    if (!value) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  private toDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}

