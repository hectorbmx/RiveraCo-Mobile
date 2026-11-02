import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSpinner, IonInput, IonTextarea, IonSearchbar, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { firstValueFrom, Subject, takeUntil, timeout } from 'rxjs';
import { AuthService } from '../services/auth';
import { MetaMecanico, ObraActivaMecanico } from '../services/mecanico-consulta.service';
import { OpcionesHorasMaquina } from '../services/mecanico-maquina-horas.service';
import { AccionAsignacionMaquina, MecanicoMaquinaAsignacionService, PendienteAsignacionMaquina, ResultadoAsignacionMaquina, SeleccionAsignacionMaquina } from '../services/mecanico-maquina-asignacion.service';
import { fechaMexico, mensajeOperacion } from '../services/mecanico-operacion.service';

@Component({ standalone: true, selector: 'app-mecanico-maquina-asignacion',
  templateUrl: './mecanico-maquina-asignacion.component.html', styleUrls: ['./mecanico-maquina-horas.component.scss'],
  imports: [CommonModule, FormsModule, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
    IonSpinner, IonInput, IonTextarea, IonSearchbar, IonSelect, IonSelectOption] })
export class MecanicoMaquinaAsignacionComponent implements OnChanges, OnDestroy {
  @Input() seleccion: SeleccionAsignacionMaquina | null = null;
  @Output() cerrado = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<OpcionesHorasMaquina>();
  @Output() guardado = new EventEmitter<ResultadoAsignacionMaquina>();
  opciones: OpcionesHorasMaquina | null = null;
  fecha = ''; lecturaInicial: number | string | null = null; notas = '';
  obraId: number | null = null; obraSeleccionada: ObraActivaMecanico | null = null;
  obras: ObraActivaMecanico[] = []; metaObras: MetaMecanico | null = null; busquedaObra = '';
  cargando = false; guardando = false; cargandoObras = false; incierto = false; contextoCambiado = false; accesoDenegado = false;
  error = ''; errorObras = ''; aviso = ''; errores: Record<string, string> = {};
  private pendiente: PendienteAsignacionMaquina | null = null;
  private usuarioId: number | null = null; private turno = 0; private turnoObras = 0; private muerto = false;
  private destruido = new Subject<void>();
  constructor(private api: MecanicoMaquinaAsignacionService, private auth: AuthService, private alert: AlertController) {}
  get accion(): AccionAsignacionMaquina { return this.pendiente?.accion ?? this.seleccion?.accion ?? 'asignar'; }
  get esAsignar() { return this.accion === 'asignar'; }
  get titulo() { return this.esAsignar ? 'Asignar máquina a obra' : 'Pasar máquina al patio'; }
  get asignacionRetiro() { return this.opciones?.asignacion_retiro ?? this.opciones?.asignacion_activa; }
  get referencia() { return this.pendiente ? this.pendiente.payload.horometro_esperado : this.opciones?.contexto.horometro_esperado; }
  get permite() { return !!this.opciones && !this.accesoDenegado && this.opciones.acciones_permitidas[this.esAsignar ? 'asignar_obra' : 'retirar_obra'] === true; }
  get puedeReintentar() { return this.auth.hasPermission(this.esAsignar ? 'maquinas.asignar_obra.access' : 'baja_maquinas.access'); }
  get bloqueado() { return this.guardando || this.cargando || this.incierto || this.contextoCambiado || !this.permite; }
  get nombreObra() { return this.pendiente ? this.pendiente.obra?.nombre || 'Obra de la operación pendiente' : this.asignacionRetiro?.obra?.nombre || 'Sin obra asignada'; }
  get obraFueraPagina() { return !!this.obraSeleccionada && !this.obras.some(o => o.id === this.obraSeleccionada?.id); }
  puedeCerrar = async () => !this.guardando;
  ngOnChanges() {
    this.turno++; this.turnoObras++; this.opciones = null; this.error = ''; this.aviso = ''; this.errores = {};
    this.guardando = false; this.cargando = false; this.cargandoObras = false; this.incierto = false; this.contextoCambiado = false; this.accesoDenegado = false;
    this.pendiente = null; this.obras = []; this.metaObras = null; this.obraId = null; this.obraSeleccionada = null; this.busquedaObra = '';
    this.usuarioId = this.auth.currentUserValue?.id ?? null;
    if (!this.seleccion) return;
    if (!this.usuarioId) { this.error = 'La sesión no está disponible. Ingresa de nuevo.'; this.accesoDenegado = true; return; }
    this.pendiente = this.api.pendiente(this.usuarioId, this.seleccion.maquinaId);
    this.incierto = !!this.pendiente;
    if (this.pendiente) {
      const p = this.pendiente;
      this.fecha = p.accion === 'asignar' ? p.payload.fecha_inicio : p.payload.fecha_fin;
      this.lecturaInicial = p.accion === 'asignar' ? p.payload.horometro_inicio : null;
      this.notas = p.accion === 'asignar' ? p.payload.notas ?? '' : '';
      this.obraId = p.accion === 'asignar' ? p.payload.obra_id : null; this.obraSeleccionada = p.obra;
    }
    void this.cargarOpciones();
  }
  ngOnDestroy() { this.muerto = true; this.turno++; this.turnoObras++; this.destruido.next(); this.destruido.complete(); }
  cerrar() { if (!this.guardando) this.cerrado.emit(); }
  alCerrar() { if (this.seleccion) this.cerrar(); }
  private vigente(turno: number, id: number) { return !this.muerto && turno === this.turno && this.seleccion?.maquinaId === id && this.usuarioId === this.auth.currentUserValue?.id; }
  async cargarOpciones(conservar = false) {
    if (!this.seleccion || !this.usuarioId || this.guardando) return;
    const id = this.seleccion.maquinaId; const turno = ++this.turno;
    this.turnoObras++; this.cargandoObras = false; this.cargando = true; this.error = ''; this.accesoDenegado = false;
    try {
      const res = await firstValueFrom(this.api.opciones(id).pipe(timeout(30000), takeUntil(this.destruido)));
      if (!this.vigente(turno, id)) return;
      this.opciones = res.data; this.contextoCambiado = false; this.actualizado.emit(res.data);
      if (!this.incierto) {
        this.fecha = fechaMexico(new Date().toISOString()).slice(0, 10);
        if (!conservar) { this.lecturaInicial = res.data.maquina.horometro_actual ?? 0; this.notas = ''; }
        this.obraId = null; this.obraSeleccionada = null; this.obras = []; this.metaObras = null; this.busquedaObra = ''; this.errores = {};
        this.aviso = conservar ? 'Datos actualizados. Revisa la operación antes de confirmar.' : '';
      }
      if ((!this.incierto && !this.permite) || (this.incierto && !this.puedeReintentar)) this.error = 'La operación no está disponible con tus permisos o con el estado actual de la máquina.';
    } catch (error: any) { if (this.vigente(turno, id)) this.manejarError(error); }
    finally { if (this.vigente(turno, id)) this.cargando = false; }
    if (this.vigente(turno, id) && !this.incierto && this.esAsignar && this.permite) void this.buscarObras();
  }
  async buscarObras(pagina = 1) {
    if (!this.seleccion || !this.esAsignar || this.bloqueado) return;
    const id = this.seleccion.maquinaId; const turno = this.turno; const busqueda = ++this.turnoObras;
    this.cargandoObras = true; this.errorObras = '';
    try {
      const res = await firstValueFrom(this.api.opciones(id, { uso: 'asignacion', q: this.busquedaObra, page: pagina }).pipe(timeout(30000), takeUntil(this.destruido)));
      if (!this.vigente(turno, id) || busqueda !== this.turnoObras) return;
      this.obras = res.data.obras ?? []; this.metaObras = res.meta ?? null;
    } catch (error: any) {
      if (!this.vigente(turno, id) || busqueda !== this.turnoObras) return;
      this.errorObras = mensajeOperacion(error); if ([401, 403].includes(error?.status)) this.manejarError(error);
    } finally { if (this.vigente(turno, id) && busqueda === this.turnoObras) this.cargandoObras = false; }
  }
  seleccionarObra() { this.obraSeleccionada = this.obraId == null ? null : this.obras.find(o => o.id === Number(this.obraId)) ?? this.obraSeleccionada; }
  private construir(): PendienteAsignacionMaquina | null {
    this.errores = {};
    const campoFecha = this.esAsignar ? 'fecha_inicio' : 'fecha_fin'; const fecha = new Date(`${this.fecha}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.fecha) || this.fecha.slice(0, 4) < '1000' || !Number.isFinite(fecha.getTime())
      || fecha.toISOString().slice(0, 10) !== this.fecha) this.errores[campoFecha] = 'Captura una fecha válida.';
    const contexto = this.esAsignar ? this.opciones!.contexto : this.opciones!.contexto_retiro ?? this.opciones!.contexto;
    if (this.esAsignar) {
      const raw = this.lecturaInicial == null ? '' : String(this.lecturaInicial).trim(); const lectura = Number(raw);
      if (!/^\d+(\.\d{1,2})?$/.test(raw) || !Number.isFinite(lectura) || lectura > 99999999.99 || lectura < (contexto.horometro_esperado ?? 0)) this.errores['horometro_inicio'] = 'La lectura inicial debe ser igual o mayor al horómetro actual, con hasta dos decimales.';
      const obra = this.obraId == null ? null : Number(this.obraId);
      if (!obra || !Number.isInteger(obra) || obra < 1 || obra !== this.obraSeleccionada?.id) this.errores['obra_id'] = 'Selecciona una obra destino.';
      if (this.notas.length > 1000) this.errores['notas'] = 'Las notas admiten hasta 1000 caracteres.';
      if (contexto.asignacion_esperada_id !== null) this.errores['asignacion_esperada_id'] = 'La máquina tiene una asignación. Actualiza sus datos.';
      return Object.keys(this.errores).length || !obra ? null : { accion: 'asignar', obra: this.obraSeleccionada,
        payload: { ...contexto, obra_id: obra, fecha_inicio: this.fecha, horometro_inicio: lectura, notas: this.notas.trim() || null } };
    }
    if (this.asignacionRetiro?.fecha_inicio && this.fecha < this.asignacionRetiro.fecha_inicio) this.errores['fecha_fin'] = 'La fecha de retiro no puede ser anterior a la asignación.';
    if (contexto.asignacion_esperada_id == null) this.errores['asignacion_esperada_id'] = 'No hay una asignación activa para retirar.';
    return Object.keys(this.errores).length || contexto.asignacion_esperada_id == null ? null : { accion: 'retirar', obra: this.asignacionRetiro?.obra ?? null,
      payload: { ...contexto, asignacion_esperada_id: contexto.asignacion_esperada_id, fecha_fin: this.fecha } };
  }
  async guardar(reintento = false) {
    if (!this.seleccion || !this.usuarioId || !this.opciones || this.guardando || this.cargando || this.accesoDenegado) return;
    if (this.usuarioId !== this.auth.currentUserValue?.id) { this.accesoDenegado = true; this.error = 'La sesión cambió. Cierra y vuelve a abrir la operación.'; return; }
    if (reintento ? !this.incierto || !this.pendiente || !this.puedeReintentar : this.bloqueado) return;
    const operacion = reintento ? this.pendiente! : this.construir(); if (!operacion) return;
    const id = this.seleccion.maquinaId; const usuario = this.usuarioId; const turno = this.turno;
    this.guardando = true; this.error = ''; this.aviso = ''; let enviado = false;
    try {
      if (operacion.accion === 'retirar' && !reintento) {
        const confirmacion = await this.alert.create({ header: 'Retirar máquina al patio',
          message: 'Se finalizará la asignación mostrada y la máquina quedará en patio. Se conservará su estado operativo actual.',
          buttons: [{ text: 'Volver', role: 'cancel' }, { text: 'Confirmar retiro', role: 'confirm' }] });
        await confirmacion.present(); const respuesta = await confirmacion.onDidDismiss();
        if (respuesta.role !== 'confirm' || !this.vigente(turno, id)) return;
      }
      if (!this.vigente(turno, id)) return;
      this.pendiente = operacion; this.api.recordar(usuario, id, operacion); enviado = true;
      const res = await firstValueFrom(this.api.guardar(id, operacion).pipe(timeout(30000), takeUntil(this.destruido)));
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
      if (this.incierto && !this.accesoDenegado) this.error = 'No se pudo confirmar la operación. Reintenta exactamente la misma captura antes de iniciar otra.';
    } finally { if (this.vigente(turno, id)) this.guardando = false; }
  }
  private manejarError(error: any) {
    this.error = mensajeOperacion(error);
    if (error?.status === 401) { this.accesoDenegado = true; this.auth.logout(); }
    if (error?.status === 403) { this.accesoDenegado = true; this.error = 'Tu acceso a esta operación no está disponible. Actualiza tu sesión antes de intentarlo de nuevo.'; }
  }
}
