import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom, Subject, takeUntil, timeout } from 'rxjs';
import { AuthService } from '../services/auth';
import { MecanicoMaquinaUbicacionService, OpcionesUbicacionMaquina } from '../services/mecanico-maquina-ubicacion.service';
import { mensajeOperacion } from '../services/mecanico-operacion.service';

export interface SeleccionMenuUbicacion { maquinaId: number; accion: 'asignar' | 'retirar' | 'ubicacion'; }
@Component({ standalone: true, selector: 'app-mecanico-maquina-ubicacion-menu',
  templateUrl: './mecanico-maquina-ubicacion-menu.component.html', styleUrls: ['./mecanico-maquina-horas.component.scss'],
  imports: [CommonModule, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSpinner] })
export class MecanicoMaquinaUbicacionMenuComponent implements OnChanges, OnDestroy {
  @Input() maquinaId: number | null = null;
  @Output() cerrado = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<OpcionesUbicacionMaquina>();
  @Output() operacion = new EventEmitter<SeleccionMenuUbicacion>();
  opciones: OpcionesUbicacionMaquina | null = null; cargando = false; cerrando = false; error = '';
  private accion: SeleccionMenuUbicacion['accion'] | null = null;
  private turno = 0; private usuario: number | null = null; private destruido = new Subject<void>();
  constructor(private api: MecanicoMaquinaUbicacionService, private auth: AuthService) {}
  get asignacion() { return this.opciones?.asignacion_retiro ?? this.opciones?.asignacion_activa; }
  get obraCerrada() { return [4, 5].includes(Number(this.asignacion?.obra?.estatus_nuevo)); }
  get puedeOfrecerObra() { return !this.asignacion && this.opciones?.maquina.estado === 'operativa'; }
  ngOnChanges() { this.turno++; this.opciones = null; this.cerrando = false; this.accion = null; this.error = ''; this.usuario = this.auth.currentUserValue?.id ?? null; if (this.maquinaId !== null) void this.cargar(); }
  ngOnDestroy() { this.turno++; this.destruido.next(); this.destruido.complete(); }
  etiqueta(valor: string | null | undefined) { return ({ en_obra: 'En obra', en_camino: 'En camino', en_patio: 'En patio', en_reparacion: 'En reparación' } as Record<string,string>)[valor ?? ''] || 'Sin ubicación'; }
  private vigente(turno: number, id: number) { return turno === this.turno && this.maquinaId === id && this.usuario === this.auth.currentUserValue?.id; }
  async cargar() {
    if (this.maquinaId === null || !this.usuario || this.cerrando) return;
    const id = this.maquinaId; const turno = ++this.turno; this.cargando = true; this.error = '';
    try {
      const res = await firstValueFrom(this.api.opciones(id).pipe(timeout(30000), takeUntil(this.destruido)));
      if (!this.vigente(turno,id)) return;
      this.opciones = res.data; this.actualizado.emit(res.data);
    } catch (error: any) { if (this.vigente(turno,id)) { this.error = mensajeOperacion(error); if (error?.status === 401) this.auth.logout(); } }
    finally { if (turno === this.turno && this.maquinaId === id) { this.cargando = false; if (this.usuario !== this.auth.currentUserValue?.id) { this.opciones = null; this.error = 'La sesión cambió. Cierra y vuelve a abrir la ubicación.'; } } }
  }
  elegir(accion: SeleccionMenuUbicacion['accion']) {
    if (!this.opciones || this.cargando || this.cerrando || this.usuario !== this.auth.currentUserValue?.id) return;
    const capacidades = this.opciones.acciones_permitidas;
    if (accion === 'retirar' ? !this.asignacion || !capacidades.retirar_obra
      : accion === 'asignar' ? !this.puedeOfrecerObra || !capacidades.asignar_obra : !capacidades.cambiar_ubicacion) return;
    this.accion = accion; this.cerrando = true;
  }
  cerrar() { this.accion = null; this.cerrando = true; }
  alCerrar() {
    if (this.accion && this.maquinaId !== null) this.operacion.emit({ maquinaId: this.maquinaId, accion: this.accion });
    else this.cerrado.emit();
  }
}
