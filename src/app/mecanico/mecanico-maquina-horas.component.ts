import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonSpinner, IonInput, IonTextarea, IonSearchbar, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { firstValueFrom, Subject, takeUntil, timeout } from 'rxjs';
import { AuthService } from '../services/auth';
import { MetaMecanico, ObraActivaMecanico } from '../services/mecanico-consulta.service';
import { CapturaHorasMaquina, fechaHoraMaquinaMexico, MecanicoMaquinaHorasService, OpcionesHorasMaquina, ResultadoHorasMaquina } from '../services/mecanico-maquina-horas.service';
import { fechaMexico, mensajeOperacion } from '../services/mecanico-operacion.service';

@Component({ standalone: true, selector: 'app-mecanico-maquina-horas',
  templateUrl: './mecanico-maquina-horas.component.html', styleUrls: ['./mecanico-maquina-horas.component.scss'],
  imports: [CommonModule, FormsModule, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
    IonSpinner, IonInput, IonTextarea, IonSearchbar, IonSelect, IonSelectOption] })
export class MecanicoMaquinaHorasComponent implements OnChanges, OnDestroy {
  @Input() maquinaId: number | null = null;
  @Output() cerrado = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<ResultadoHorasMaquina>();
  opciones: OpcionesHorasMaquina | null = null;
  lecturaNueva: number | string | null = null; fechaRegistro = ''; inicio = ''; fin = ''; notas = '';
  obraId: number | null = null; obraSeleccionada: ObraActivaMecanico | null = null;
  obras: ObraActivaMecanico[] = []; metaObras: MetaMecanico | null = null; busquedaObra = '';
  cargando = false; guardando = false; cargandoObras = false; incierto = false; contextoCambiado = false; accesoDenegado = false;
  error = ''; errorObras = ''; aviso = ''; errores: Record<string, string> = {};
  private destruido = new Subject<void>();
  private pendiente: CapturaHorasMaquina | null = null;
  private usuarioId: number | null = null; private turno = 0; private turnoObras = 0; private muerto = false;
  constructor(private api: MecanicoMaquinaHorasService, private auth: AuthService) {}
  get esRegistro() { return (this.pendiente ? this.pendiente.asignacion_esperada_id : this.opciones?.contexto.asignacion_esperada_id) != null; }
  get titulo() { return this.esRegistro ? 'Registrar horas de máquina' : 'Ajustar horómetro'; }
  get referencia() { return this.pendiente ? this.pendiente.horometro_esperado : this.opciones?.contexto.horometro_esperado; }
  get permite() {
    return !!this.opciones && !this.accesoDenegado && this.opciones.acciones_permitidas[this.esRegistro ? 'registrar_horas' : 'ajustar_horometro'] === true;
  }
  get puedeReintentar() { return !!this.opciones && (this.opciones.acciones_permitidas.registrar_horas || this.opciones.acciones_permitidas.ajustar_horometro); }
  get bloqueado() { return this.guardando || this.cargando || this.incierto || this.contextoCambiado || !this.permite; }
  get obraActual() {
    if (this.pendiente && this.pendiente.asignacion_esperada_id !== this.opciones?.contexto.asignacion_esperada_id) return 'Asignación original pendiente de confirmar';
    return this.opciones?.asignacion_activa?.obra?.nombre || 'Sin obra asignada';
  }
  get obraFueraPagina() { return !!this.obraSeleccionada && !this.obras.some(o => o.id === this.obraSeleccionada?.id); }
  puedeCerrar = async () => !this.guardando;
  ngOnChanges() {
    this.turno++; this.turnoObras++; this.opciones = null; this.error = ''; this.aviso = ''; this.errores = {};
    this.guardando = false; this.cargandoObras = false; this.incierto = false; this.contextoCambiado = false; this.accesoDenegado = false;
    this.pendiente = null; this.obras = []; this.metaObras = null; this.obraId = null; this.obraSeleccionada = null; this.busquedaObra = '';
    this.usuarioId = this.auth.currentUserValue?.id ?? null;
    if (this.maquinaId !== null) {
      if (!this.usuarioId) { this.error = 'La sesión no está disponible. Ingresa de nuevo.'; this.accesoDenegado = true; return; }
      this.pendiente = this.api.pendiente(this.usuarioId, this.maquinaId);
      this.incierto = !!this.pendiente;
      if (this.pendiente) this.restaurar(this.pendiente);
      void this.cargarOpciones();
    }
  }
  ngOnDestroy() { this.muerto = true; this.turno++; this.turnoObras++; this.destruido.next(); this.destruido.complete(); }
  cerrar() { if (!this.guardando) this.cerrado.emit(); }
  alCerrar() { if (this.maquinaId !== null) this.cerrar(); }
  private vigente(turno: number, id: number) {
    return !this.muerto && turno === this.turno && this.maquinaId === id && this.usuarioId === this.auth.currentUserValue?.id;
  }
  async cargarOpciones(conservar = false) {
    if (this.guardando || this.maquinaId === null || !this.usuarioId) return;
    const id = this.maquinaId; const turno = ++this.turno;
    this.turnoObras++; this.cargandoObras = false;
    this.cargando = true; this.error = ''; this.accesoDenegado = false;
    try {
      const res = await firstValueFrom(this.api.opciones(id).pipe(timeout(30000), takeUntil(this.destruido)));
      if (!this.vigente(turno, id)) return;
      this.opciones = res.data; this.contextoCambiado = false;
      if (!this.incierto) {
        const ahora = fechaMexico(new Date().toISOString());
        if (!conservar) { this.lecturaNueva = null; this.notas = ''; }
        this.fechaRegistro = ahora.slice(0, 10); this.inicio = ahora; this.fin = ahora;
        this.obraId = null; this.obraSeleccionada = null; this.obras = []; this.metaObras = null; this.busquedaObra = '';
        this.errores = {};
        this.aviso = conservar ? 'Datos actualizados. Revisa la captura antes de guardar.' : '';
      }
      if ((!this.incierto && !this.permite) || (this.incierto && !this.puedeReintentar)) this.error = 'No tienes habilitada la captura de horas para esta máquina.';
    } catch (error: any) {
      if (this.vigente(turno, id)) this.manejarError(error);
    } finally { if (this.vigente(turno, id)) this.cargando = false; }
  }
  async buscarObras(pagina = 1) {
    if (this.esRegistro || this.bloqueado || this.maquinaId === null) return;
    const id = this.maquinaId; const turno = this.turno; const busqueda = ++this.turnoObras;
    this.cargandoObras = true; this.errorObras = '';
    try {
      const res = await firstValueFrom(this.api.opciones(id, { uso: 'ajuste', q: this.busquedaObra, page: pagina }).pipe(timeout(30000), takeUntil(this.destruido)));
      if (!this.vigente(turno, id) || busqueda !== this.turnoObras) return;
      // Buscar obras no reemplaza silenciosamente el contexto de la captura.
      this.obras = res.data.obras ?? []; this.metaObras = res.meta ?? null;
    } catch (error: any) {
      if (!this.vigente(turno, id) || busqueda !== this.turnoObras) return;
      this.errorObras = mensajeOperacion(error);
      if ([401, 403].includes(error?.status)) this.manejarError(error);
    } finally { if (this.vigente(turno, id) && busqueda === this.turnoObras) this.cargandoObras = false; }
  }
  seleccionarObra() {
    this.obraSeleccionada = this.obraId == null ? null : this.obras.find(o => o.id === Number(this.obraId)) ?? this.obraSeleccionada;
  }
  private construir(): CapturaHorasMaquina | null {
    this.errores = {};
    const raw = this.lecturaNueva == null ? '' : String(this.lecturaNueva).trim(); const lectura = Number(raw);
    if (!/^\d+(\.\d{1,2})?$/.test(raw) || !Number.isFinite(lectura) || lectura > 99999999.99 || lectura <= (this.referencia ?? 0)) {
      this.errores['horometro_fin'] = 'Captura un horómetro mayor al actual, con hasta dos decimales.';
    }
    if (this.notas.length > 500) this.errores['notas'] = 'Las notas admiten hasta 500 caracteres.';
    const base = { ...this.opciones!.contexto, horometro_fin: lectura, notas: this.notas.trim() || null };
    if (this.esRegistro) {
      const inicio = fechaHoraMaquinaMexico(this.inicio); const fin = fechaHoraMaquinaMexico(this.fin);
      if (!inicio) this.errores['inicio'] = 'Captura una fecha y hora de inicio válidas.';
      if (!fin || (inicio && fin && new Date(fin).getTime() < new Date(inicio).getTime())) this.errores['fin'] = 'El fin debe ser igual o posterior al inicio.';
      return Object.keys(this.errores).length || !inicio || !fin ? null : { ...base, inicio, fin };
    }
    const fecha = new Date(`${this.fechaRegistro}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.fechaRegistro) || this.fechaRegistro.slice(0, 4) < '1000'
      || !Number.isFinite(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== this.fechaRegistro) this.errores['fecha_registro'] = 'Captura una fecha válida.';
    const obra = this.obraId == null ? null : Number(this.obraId);
    if (obra !== null && (!Number.isInteger(obra) || obra < 1 || this.obraSeleccionada?.id !== obra)) this.errores['obra_id'] = 'Selecciona una obra válida o deja la captura sin obra relacionada.';
    return Object.keys(this.errores).length ? null : { ...base, fecha_registro: this.fechaRegistro, obra_id: obra };
  }
  async guardar(reintento = false) {
    if (this.guardando || this.cargando || this.accesoDenegado || this.maquinaId === null || !this.usuarioId || !this.opciones) return;
    if (this.usuarioId !== this.auth.currentUserValue?.id) { this.accesoDenegado = true; this.error = 'La sesión cambió. Cierra esta ventana y vuelve a abrir la captura.'; return; }
    if (reintento ? !this.incierto || !this.pendiente || !this.puedeReintentar : this.bloqueado) return;
    const payload = reintento ? this.pendiente! : this.construir(); if (!payload) return;
    const id = this.maquinaId; const usuario = this.usuarioId; const turno = this.turno;
    this.pendiente = { ...payload }; this.api.recordar(usuario, id, payload);
    this.guardando = true; this.error = ''; this.aviso = '';
    try {
      const res = await firstValueFrom(this.api.guardar(id, { ...payload }).pipe(timeout(30000), takeUntil(this.destruido)));
      this.api.olvidar(usuario, id);
      if (!this.vigente(turno, id)) return;
      this.incierto = false; this.pendiente = null; this.guardando = false;
      this.guardado.emit(res.data);
    } catch (error: any) {
      if (!this.vigente(turno, id)) return;
      const status = error?.status;
      if (status === 409 || status === 422) {
        this.api.olvidar(usuario, id); this.pendiente = null; this.incierto = false;
        this.contextoCambiado = status === 409;
      } else {
        // Incluye timeout/desconexión y autenticación: no prueban que el primer intento no se guardó.
        this.incierto = true;
      }
      this.manejarError(error);
      for (const [campo, mensajes] of Object.entries(error?.error?.errors ?? {})) this.errores[campo] = Array.isArray(mensajes) ? mensajes.join(' ') : String(mensajes);
      if (this.incierto && !this.accesoDenegado) this.error = 'No se pudo confirmar el guardado. Reintenta la misma captura; no se enviarán datos distintos.';
    } finally { if (this.vigente(turno, id)) this.guardando = false; }
  }
  private restaurar(payload: CapturaHorasMaquina) {
    this.lecturaNueva = payload.horometro_fin; this.notas = payload.notas ?? '';
    if (payload.asignacion_esperada_id !== null) { this.inicio = fechaMexico(payload.inicio); this.fin = fechaMexico(payload.fin); }
    else { this.fechaRegistro = payload.fecha_registro ?? ''; this.obraId = payload.obra_id ?? null; }
  }
  private manejarError(error: any) {
    this.error = mensajeOperacion(error);
    if (error?.status === 401) { this.accesoDenegado = true; this.auth.logout(); }
    if (error?.status === 403) { this.accesoDenegado = true; this.error = 'Tu acceso a esta operación no está disponible. Actualiza tu sesión antes de intentarlo de nuevo.'; }
  }
}
