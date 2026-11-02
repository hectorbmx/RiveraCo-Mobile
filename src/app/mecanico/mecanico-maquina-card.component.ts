import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { AccionAsignacionMaquina, SeleccionAsignacionMaquina } from '../services/mecanico-maquina-asignacion.service';
import { FilaMecanico, PreventivoMaquina } from '../services/mecanico-consulta.service';

@Component({
  standalone: true, selector: 'app-mecanico-maquina-card',
  imports: [CommonModule, RouterLink, IonButton],
  templateUrl: './mecanico-maquina-card.component.html',
  styleUrls: ['./mecanico-maquina-card.component.scss', './mecanico-equipo-listado.scss'],
})
export class MecanicoMaquinaCardComponent implements OnInit {
  expandida = false;
  @Input({ required: true }) maquina!: FilaMecanico;
  @Input() detalle = false;
  @Input() puedeProgramar = false;
  @Input() puedeCapturarHoras = false;
  @Input() puedeAsignarObra = false;
  @Input() puedeRetirarObra = false;
  @Input() puedeCambiarUbicacion = false;
  @Input() ubicacionPendiente = false;
  @Output() cambiarUbicacion = new EventEmitter<number>();
  @Input() asignacionPendiente: AccionAsignacionMaquina | null = null;
  @Output() gestionarAsignacion = new EventEmitter<SeleccionAsignacionMaquina>();
  @Output() capturarHoras = new EventEmitter<number>();
  @Output() gestionarUbicacion = new EventEmitter<number>();

  ngOnInit() { this.expandida = this.detalle; }

  get subtitulo(): string {
    return [this.maquina.nombre, this.maquina.modelo].filter(Boolean).join(' · ') || 'Sin datos de modelo';
  }
  get identidad(): string {
    return [this.maquina.marca, this.maquina.modelo, this.maquina.tipo].filter(Boolean).join(' · ');
  }
  etiqueta(valor: string | null | undefined): string {
    const etiquetas: Record<string, string> = {
      operativa: 'Operativa', fuera_servicio: 'Fuera de servicio', fuera_de_servicio: 'Fuera de servicio',
      baja_definitiva: 'Baja definitiva', en_reparacion: 'En reparación',
      en_obra: 'En obra', en_camino: 'En camino', en_patio: 'En patio',
    };
    return valor ? etiquetas[valor] || valor.replace(/_/g, ' ') : 'Sin estado';
  }
  estadoPreventivo(preventivo: PreventivoMaquina): string {
    return { sin_datos: 'Sin datos', ok: 'Al día', proximo: 'Próximo', vencido: 'Vencido' }[preventivo.estado] || 'Sin datos';
  }
  progreso(preventivo: PreventivoMaquina): number {
    return Number.isFinite(preventivo.porcentaje) ? Math.min(100, Math.max(0, preventivo.porcentaje)) : 0;
  }
  fechaCivil(fecha: string): string {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : 'Sin fecha';
  }
}
