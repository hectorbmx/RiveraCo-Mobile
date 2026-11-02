import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSpinner, IonInput, IonTextarea, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { firstValueFrom, Subject, takeUntil, timeout } from 'rxjs';
import { AuthService } from '../services/auth';
import { mensajeOperacion } from '../services/mecanico-operacion.service';
import { MecanicoMaquinaUbicacionService, OpcionesUbicacionMaquina, PendienteUbicacionMaquina, ResultadoUbicacionMaquina, UbicacionMaquina, UBICACIONES_MAQUINA } from '../services/mecanico-maquina-ubicacion.service';

@Component({ standalone: true, selector: 'app-mecanico-maquina-ubicacion',
  templateUrl: './mecanico-maquina-ubicacion.component.html', styleUrls: ['./mecanico-maquina-horas.component.scss'],
  imports: [CommonModule, FormsModule, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
    IonSpinner, IonInput, IonTextarea, IonSelect, IonSelectOption] })
export class MecanicoMaquinaUbicacionComponent implements OnChanges, OnDestroy {
  @Input() maquinaId: number | null = null;
  @Output() cerrado = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<OpcionesUbicacionMaquina>();
  @Output() guardado = new EventEmitter<ResultadoUbicacionMaquina>();
  opciones: OpcionesUbicacionMaquina | null = null;
  destino: UbicacionMaquina | null = null; motivo = ''; notas = '';
  cargando = false; guardando = false; incierto = false; contextoCambiado = false; accesoDenegado = false;
  error = ''; aviso = ''; errores: Record<string, string> = {};
  private pendiente: PendienteUbicacionMaquina | null = null;
  private usuarioId: number | null = null; private turno = 0; private muerto = false;
  private destruido = new Subject<void>(); private confirmacion: HTMLIonAlertElement | null = null;
  constructor(private api: MecanicoMaquinaUbicacionService, private auth: AuthService, private alert: AlertController) {}
  get tienePermiso() { return this.auth.hasPermission('maquinas.ubicacion.update.access'); }
  get destinos() { return (this.opciones?.ubicaciones_permitidas ?? []).filter(v => UBICACIONES_MAQUINA.includes(v)); }
  get permite() { return this.tienePermiso && !this.accesoDenegado && !!this.opciones?.acciones_permitidas.cambiar_ubicacion && this.destinos.length > 0; }
  get bloqueado() { return this.guardando || this.cargando || this.incierto || this.contextoCambiado || !this.permite; }
  get obra() { return this.pendiente ? this.pendiente.obra : this.opciones?.asignacion_activa?.obra?.nombre ?? null; }
  get conservaAsignacion() { return (this.pendiente ? this.pendiente.payload.asignacion_esperada_id : this.opciones?.contexto_ubicacion?.asignacion_esperada_id) != null; }
  get ubicacionReferencia() { return this.pendiente ? this.pendiente.payload.ubicacion_esperada : this.opciones?.contexto_ubicacion?.ubicacion_esperada; }
  get destinoFueraLista() { return this.destino !== null && !this.destinos.includes(this.destino); }
  puedeCerrar = async () => !this.guardando;
  etiqueta(valor: string | null | undefined) {
    const nombres: Record<string, string> = { en_obra: 'En obra', en_camino: 'En camino', en_reparacion: 'En reparación', en_patio: 'En patio' };
    return valor ? nombres[valor] ?? valor : 'Sin ubicación';
  }
  ngOnChanges() {
    this.turno++; this.opciones = null; this.error = ''; this.aviso = ''; this.errores = {}; this.pendiente = null;
    this.cargando = false; this.guardando = false; this.incierto = false; this.contextoCambiado = false; this.accesoDenegado = false;
    this.destino = null; this.motivo = ''; this.notas = ''; this.usuarioId = this.auth.currentUserValue?.id ?? null;
    if (this.maquinaId === null) return;
    if (!this.usuarioId) { this.error = 'La sesión no está disponible. Ingresa de nuevo.'; this.accesoDenegado = true; return; }
    this.pendiente = this.api.pendiente(this.usuarioId, this.maquinaId); this.incierto = !!this.pendiente;
    if (this.pendiente) { this.destino = this.pendiente.payload.ubicacion; this.motivo = this.pendiente.payload.motivo; this.notas = this.pendiente.payload.notas ?? ''; }
    void this.cargarOpciones();
  }
  ngOnDestroy() {
    this.muerto = true; this.turno++; this.destruido.next(); this.destruido.complete();
    if (this.confirmacion) void this.confirmacion.dismiss(undefined, 'cancel');
  }
  cerrar() { if (!this.guardando) this.cerrado.emit(); }
  alCerrar() { if (this.maquinaId !== null) this.cerrar(); }
  private mismaSeleccion(turno: number, id: number) { return !this.muerto && turno === this.turno && this.maquinaId === id; }
  private vigente(turno: number, id: number) { return this.mismaSeleccion(turno, id) && this.usuarioId === this.auth.currentUserValue?.id; }
  private revisarSesion() {
    if (this.usuarioId !== this.auth.currentUserValue?.id) { this.accesoDenegado = true; this.error = 'La sesión cambió. Cierra y vuelve a abrir la operación.'; }
  }
  async cargarOpciones(conservar = false) {
    if (this.maquinaId === null || !this.usuarioId || this.guardando) return;
    const id = this.maquinaId; const turno = ++this.turno;
    this.cargando = true; this.error = ''; this.accesoDenegado = false;
    try {
      const res = await firstValueFrom(this.api.opciones(id).pipe(timeout(30000), takeUntil(this.destruido)));
      if (!this.vigente(turno, id)) return;
      if (!res.data.contexto_ubicacion || !Array.isArray(res.data.ubicaciones_permitidas)) throw new Error('El servidor todavía no tiene disponible el cambio de ubicación.');
      this.opciones = res.data; this.contextoCambiado = false; this.actualizado.emit(res.data);
      if (!this.incierto) {
        if (!conservar) { this.destino = null; this.motivo = ''; this.notas = ''; }
        else if (this.destino && !this.destinos.includes(this.destino)) this.destino = null;
        this.errores = {}; this.aviso = conservar ? 'Datos actualizados. Revisa el destino y confirma de nuevo.' : '';
      }
      if (!this.tienePermiso || (!this.incierto && !this.permite)) this.error = 'No hay cambios de ubicación disponibles con tus permisos o con la asignación actual.';
    } catch (error: any) { if (this.vigente(turno, id)) this.manejarError(error); }
    finally { if (this.mismaSeleccion(turno, id)) { this.cargando = false; this.revisarSesion(); } }
  }
  private construir(): PendienteUbicacionMaquina | null {
    this.errores = {}; const motivo = this.motivo.trim(); const notas = this.notas.trim();
    if (!this.destino || !this.destinos.includes(this.destino)) this.errores['ubicacion'] = 'Selecciona uno de los destinos permitidos.';
    if (!motivo || Array.from(motivo).length > 190) this.errores['motivo'] = 'Captura un motivo de hasta 190 caracteres.';
    if (Array.from(notas).length > 2000) this.errores['notas'] = 'Las notas admiten hasta 2000 caracteres.';
    if (Object.keys(this.errores).length || !this.destino || !this.opciones) return null;
    return { obra: this.opciones.asignacion_activa?.obra?.nombre ?? null,
      payload: { ...this.opciones.contexto_ubicacion, ubicacion: this.destino, motivo, notas: notas || null } };
  }
  async guardar(reintento = false) {
    if (this.maquinaId === null || !this.usuarioId || !this.opciones || this.guardando || this.cargando || this.accesoDenegado) return;
    this.revisarSesion(); if (this.accesoDenegado) return;
    if (reintento ? !this.incierto || !this.pendiente || !this.tienePermiso : this.bloqueado) return;
    const operacion = reintento ? this.pendiente! : this.construir(); if (!operacion) return;
    const id = this.maquinaId; const usuario = this.usuarioId; const turno = this.turno;
    this.guardando = true; this.error = ''; this.aviso = ''; let enviado = false;
    try {
      if (!reintento) {
        this.confirmacion = await this.alert.create({ header: 'Confirmar ubicación',
          message: `La máquina quedará ${this.etiqueta(operacion.payload.ubicacion).toLowerCase()}. `
            + (operacion.payload.asignacion_esperada_id !== null ? 'Conservará su asignación a la obra mostrada.' : 'Continuará sin obra asignada.')
            + ' Su estado operativo no cambiará.',
          buttons: [{ text: 'Volver', role: 'cancel' }, { text: 'Confirmar cambio', role: 'confirm' }] });
        if (!this.vigente(turno, id)) { await this.confirmacion.dismiss(undefined, 'cancel'); return; }
        await this.confirmacion.present(); const respuesta = await this.confirmacion.onDidDismiss(); this.confirmacion = null;
        if (respuesta.role !== 'confirm' || !this.vigente(turno, id)) return;
      }
      if (!this.vigente(turno, id)) return;
      this.pendiente = operacion; this.api.recordar(usuario, id, operacion); enviado = true;
      const res = await firstValueFrom(this.api.guardar(id, operacion.payload).pipe(timeout(30000), takeUntil(this.destruido)));
      this.api.olvidar(usuario, id);
      if (!this.vigente(turno, id)) return;
      this.pendiente = null; this.incierto = false; this.guardando = false; this.guardado.emit(res.data);
    } catch (error: any) {
      if (!this.vigente(turno, id)) return;
      if (enviado) {
        if ([409, 422].includes(error?.status)) {
          this.api.olvidar(usuario, id); this.pendiente = null; this.incierto = false; this.contextoCambiado = error.status === 409;
        } else this.incierto = true;
      }
      this.manejarError(error);
      for (const [campo, mensajes] of Object.entries(error?.error?.errors ?? {})) this.errores[campo] = Array.isArray(mensajes) ? mensajes.join(' ') : String(mensajes);
      if (this.incierto && !this.accesoDenegado) this.error = 'No se pudo confirmar el cambio. Reintenta exactamente la misma operación antes de capturar otra.';
    } finally { if (this.mismaSeleccion(turno, id)) { this.guardando = false; this.revisarSesion(); } }
  }
  private manejarError(error: any) {
    this.error = mensajeOperacion(error);
    if (error?.status === 401) { this.accesoDenegado = true; this.auth.logout(); }
    if (error?.status === 403) { this.accesoDenegado = true; this.error = 'Tu permiso de cambio de ubicación no está disponible. Actualiza tu sesión antes de intentarlo de nuevo.'; }
  }
}
