import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonSpinner } from '@ionic/angular/standalone';
import { VehiculoHistorialMeta } from 'src/app/models/vehiculo.model';

export interface HistorialVista {
  paginaSolicitada: number; abierto: boolean; consultado: boolean; loading: boolean; error: string;
  desde: string; hasta: string; estatus: string; meta: VehiculoHistorialMeta | null;
}
export interface EstadoHistorial<T> extends HistorialVista { data: T[]; }
export function nuevoHistorial<T>(): EstadoHistorial<T> {
  return { paginaSolicitada: 1, abierto: false, consultado: false, loading: false, error: '', desde: '', hasta: '', estatus: '', meta: null, data: [] };
}
@Component({
  selector: 'app-vehiculo-historial', standalone: true,
  imports: [CommonModule, FormsModule, IonSpinner],
  templateUrl: './vehiculo-historial.component.html',
  styleUrls: ['./vehiculo-historial.component.scss']
})
export class VehiculoHistorialComponent {
  @Input({ required: true }) titulo = '';
  @Input({ required: true }) estado!: HistorialVista;
  @Input() fechaLabel = 'Fecha';
  @Input() mecanico = false;
  @Input() estados: { valor: string; nombre: string }[] = [];
  @Output() abrir = new EventEmitter<boolean>();
  @Output() pagina = new EventEmitter<number>();
  toggle(event: Event) { this.abrir.emit((event.target as HTMLDetailsElement).open); }
}
