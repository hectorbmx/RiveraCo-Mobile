import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonBadge,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  carSportOutline,
  chevronForward,
  documentTextOutline,
  personCircle,
  shieldCheckmarkOutline,
  speedometerOutline,
  warningOutline,
} from 'ionicons/icons';
import { ProfileMenuComponent } from 'src/app/components/profile-menu/profile-menu.component';
import { VehiculoListItemDto, VehiculosResponse } from 'src/app/models/vehiculo.model';
import { VehiculosGerencialService } from 'src/app/services/gerencial-vehiculo.service';

@Component({
  selector: 'app-gerencial-vehiculos',
  templateUrl: './gerencial-vehiculos.page.html',
  styleUrls: ['./gerencial-vehiculos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonBadge,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSearchbar,
    IonSpinner,
    ProfileMenuComponent,
  ],
})
export class GerencialVehiculosPage implements OnInit {
  vehiculos: VehiculoListItemDto[] = [];
  loading = false;
  searchTerm = '';
  soloAsignados = false;

  constructor(private vehiculosSvc: VehiculosGerencialService) {
    addIcons({
      alertCircleOutline,
      carSportOutline,
      chevronForward,
      documentTextOutline,
      personCircle,
      shieldCheckmarkOutline,
      speedometerOutline,
      warningOutline,
    });
  }

  ngOnInit() {
    this.cargarVehiculos();
  }

  ionViewWillEnter() {
    this.cargarVehiculos();
  }

  cargarVehiculos(event?: any) {
    this.loading = true;

    const page = this.searchTerm ? 1 : undefined;
    const q = this.searchTerm?.trim() || undefined;

    this.vehiculosSvc.getVehiculos(page, q, this.soloAsignados).subscribe({
      next: (res: VehiculosResponse) => {
        const rows = res.data?.data ?? [];
        this.vehiculos = [...rows].sort((a, b) => {
          const placasA = (a.placas ?? '').trim().toLowerCase();
          const placasB = (b.placas ?? '').trim().toLowerCase();
          const nombreA = this.nombreVehiculo(a).toLowerCase();
          const nombreB = this.nombreVehiculo(b).toLowerCase();

          return placasA.localeCompare(placasB) || nombreA.localeCompare(nombreB);
        });
        this.loading = false;
        event?.target?.complete?.();
      },
      error: (err) => {
        this.loading = false;
        event?.target?.complete?.();
        console.error('Error al cargar vehículos', err);
      },
    });
  }

  onSearchChange(value: string | null | undefined) {
    this.searchTerm = value || '';
    this.cargarVehiculos();
  }

  nombreVehiculo(vehiculo: VehiculoListItemDto): string {
    return [vehiculo.marca, vehiculo.modelo, vehiculo.anio]
      .filter(Boolean)
      .join(' ') || 'Vehículo sin nombre';
  }

  empleadoAsignado(vehiculo: VehiculoListItemDto): string {
    return vehiculo.asignacion_actual?.empleado?.nombre || 'Sin empleado asignado';
  }

  seguroBadgeClass(vehiculo: VehiculoListItemDto): string {
    const estatus = vehiculo.seguro_vigente?.estatus;

    if (!vehiculo.seguro_vigente) return 'badge-alert';
    if (estatus === 'vencida' || estatus === 'cancelada') return 'badge-alert';

    return 'badge-ok';
  }

  seguroLabel(vehiculo: VehiculoListItemDto): string {
    if (!vehiculo.seguro_vigente) return 'Sin seguro';

    return vehiculo.seguro_vigente.estatus === 'vencida'
      ? 'Seguro vencido'
      : 'Seguro OK';
  }

  documentoBadgeClass(vehiculo: VehiculoListItemDto): string {
    if (!vehiculo.tarjeta_circulacion) return 'badge-soft';

    return vehiculo.tarjeta_circulacion.vigente ? 'badge-ok' : 'badge-alert';
  }

  documentoLabel(vehiculo: VehiculoListItemDto): string {
    if (!vehiculo.tarjeta_circulacion) return 'Sin tarjeta';

    return vehiculo.tarjeta_circulacion.vigente ? 'Tarjeta OK' : 'Tarjeta vencida';
  }
}

