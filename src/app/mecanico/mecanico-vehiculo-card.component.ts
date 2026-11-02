import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { FilaMecanico } from '../services/mecanico-consulta.service';

@Component({
  selector: 'app-mecanico-vehiculo-card', standalone: true,
  imports: [CommonModule, RouterLink, IonButton],
  templateUrl: './mecanico-vehiculo-card.component.html',
  styleUrls: ['./mecanico-maquina-card.component.scss', './mecanico-vehiculo-card.component.scss', './mecanico-equipo-listado.scss']
})
export class MecanicoVehiculoCardComponent {
  @Input({ required: true }) vehiculo!: FilaMecanico;
  expandida = false;
  get nombre() {
    return [this.vehiculo.marca, this.vehiculo.modelo, this.vehiculo.anio].filter(Boolean).join(' ')
      || this.vehiculo.nombre || 'Vehículo sin nombre';
  }
  etiqueta(valor: string | null | undefined) {
    const etiquetas: Record<string, string> = {
      activo: 'Activo', activa: 'Activa', disponible: 'Disponible', operativa: 'Operativa',
      inactivo: 'Inactivo', baja: 'Baja', baja_definitiva: 'Baja definitiva',
      en_taller: 'En taller', en_reparacion: 'En reparación', fuera_servicio: 'Fuera de servicio',
      fuera_de_servicio: 'Fuera de servicio', mantenimiento: 'Mantenimiento'
    };
    return valor ? etiquetas[valor] || valor.replace(/_/g, ' ') : 'Sin estado';
  }
  fecha(fecha: string | null | undefined) {
    const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha || '');
    return p ? `${p[3]}/${p[2]}/${p[1]}` : 'Sin fecha registrada';
  }
}
