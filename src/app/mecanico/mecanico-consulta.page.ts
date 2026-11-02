import { AppNotificacionesComponent } from '../components/app-notificaciones/app-notificaciones.component';
import { MecanicoVehiculoCardComponent } from './mecanico-vehiculo-card.component';
import { MecanicoLoadingService } from '../services/mecanico-loading.service';
import type { RefresherCustomEvent } from '@ionic/core';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonRefresher, IonRefresherContent, IonSearchbar, IonSpinner, IonList, IonItem, IonLabel, IonBadge, IonSelect, IonSelectOption, IonToggle, IonInput, AlertController } from '@ionic/angular/standalone';
import { combineLatest, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';
import { MecanicoMaquinaUbicacionMenuComponent, SeleccionMenuUbicacion } from './mecanico-maquina-ubicacion-menu.component';
import { MecanicoMaquinaUbicacionComponent } from './mecanico-maquina-ubicacion.component';
import { MecanicoMaquinaUbicacionService, ResultadoUbicacionMaquina } from '../services/mecanico-maquina-ubicacion.service';
import { MecanicoMaquinaAsignacionComponent } from './mecanico-maquina-asignacion.component';
import { MecanicoMaquinaAsignacionService, ResultadoAsignacionMaquina, SeleccionAsignacionMaquina } from '../services/mecanico-maquina-asignacion.service';
import { MecanicoMaquinaHorasComponent } from './mecanico-maquina-horas.component';
import { MecanicoMaquinaHorasService, OpcionesHorasMaquina, ResultadoHorasMaquina } from '../services/mecanico-maquina-horas.service';
import { MecanicoMaquinaCardComponent } from './mecanico-maquina-card.component';
import { MecanicoOperacionesComponent } from './mecanico-operaciones.component';
import { fechaMexico } from '../services/mecanico-operacion.service';
import { MecanicoConsultaService, RecursoMecanico, FilaMecanico, MetaMecanico, DetalleEquipo, DetalleServicio } from '../services/mecanico-consulta.service';

@Component({
  standalone: true, selector: 'app-mecanico-consulta', templateUrl: './mecanico-consulta.page.html',
  styleUrls: ['./mecanico-consulta.page.scss'],
  imports: [AppNotificacionesComponent, CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonRefresher, IonRefresherContent,
    IonSearchbar, IonSpinner, IonList, IonItem, IonLabel, IonBadge, IonSelect, IonSelectOption, IonToggle, IonInput, MecanicoOperacionesComponent, MecanicoMaquinaCardComponent, MecanicoVehiculoCardComponent, MecanicoMaquinaHorasComponent, MecanicoMaquinaAsignacionComponent, MecanicoMaquinaUbicacionComponent, MecanicoMaquinaUbicacionMenuComponent],
})
export class MecanicoConsultaPage implements OnInit {
  recurso: RecursoMecanico = 'servicios'; id: number | null = null;
  filas: FilaMecanico[] = []; equipo: FilaMecanico | null = null; historial: FilaMecanico[] = [];
  servicio: DetalleServicio | null = null; meta: MetaMecanico | null = null;
  busqueda = ''; estatus = ''; soloMios = false; cargando = false; error = '';
  fechaDesde = ''; fechaHasta = ''; equipoTipo: '' | 'maquinas' | 'vehiculos' = ''; equipoId: number | null = null;
  equipoSeleccionado: FilaMecanico | null = null;
  get equipoSeleccionadoFueraPagina() { return this.equipoSeleccionado && !this.equipos.some(e => e.id === this.equipoSeleccionado?.id); }
  equipoBusqueda = ''; equipos: FilaMecanico[] = []; metaEquipos: MetaMecanico | null = null;
  cargandoEquipos = false; errorEquipos = ''; private secuenciaEquipos = 0;
  estados = ['borrador', 'orden_generada', 'pendiente', 'en_proceso', 'completado', 'cancelado'];
  private secuencia = 0; private destroyRef = inject(DestroyRef);
  constructor(private route: ActivatedRoute, private router: Router, public auth: AuthService,
    private consulta: MecanicoConsultaService, private alert: AlertController, private asignaciones: MecanicoMaquinaAsignacionService, private ubicaciones: MecanicoMaquinaUbicacionService, private horasMaquina: MecanicoMaquinaHorasService, private loaderCorporativo: MecanicoLoadingService) {
    this.destroyRef.onDestroy(() => { this.cerrarCarga?.(); this.secuencia++; this.secuenciaEquipos++; });
  }
  horaEjecucion(fecha: string | null | undefined) { return fechaMexico(fecha).replace('T', ' '); }
  get materialesConAvance() {
    const pendientes = [...(this.servicio?.avance_materiales ?? [])];
    return (this.servicio?.materiales ?? []).map(material => {
      const indice = material.incluido ? pendientes.findIndex(avance =>
        material.material_preventivo_id != null
          ? avance.material_preventivo_id === material.material_preventivo_id
          : material.producto_id != null && avance.producto_id === material.producto_id) : -1;
      return { ...material, avance: indice >= 0 ? pendientes.splice(indice, 1)[0] : null };
    });
  }
  get estadoAbastecimiento(): { texto: string; tono: string } {
    const s = this.servicio;
    if (!s?.orden.folio) return { texto: 'Sin orden', tono: 'neutro' };
    const incluidos = this.materialesConAvance.filter(m => m.incluido && m.cantidad_requerida > 0);
    if (!incluidos.length) return { texto: 'Sin materiales', tono: 'neutro' };
    if (incluidos.every(m => m.avance && m.avance.faltante <= 0.0005)) return { texto: 'Surtida', tono: 'surtido' };
    if (s.avance_materiales.some(m => m.surtido > 0)) return { texto: 'Surtido parcial', tono: 'pendiente' };
    const activas = s.solicitudes.filter(solicitud => !['cancelada', 'surtida'].includes(solicitud.estado));
    if (activas.length === 1) {
      return { texto: this.estadoSolicitud(activas[0]), tono: 'pendiente' };
    }
    if (activas.length > 1) return { texto: 'Abastecimiento en proceso', tono: 'pendiente' };
    if (s.solicitudes.length && s.solicitudes.every(solicitud => solicitud.estado === 'cancelada')) return { texto: 'Solicitudes canceladas', tono: 'neutro' };
    return { texto: s.solicitudes.length ? 'Material pendiente' : 'Sin solicitar', tono: 'pendiente' };
  }
  estadoSolicitud(solicitud: DetalleServicio['solicitudes'][number]): string {
    if (solicitud.tipo !== 'compra') return `Almacén ${this.etiqueta(solicitud.estado)}`;
    if (['pendiente', 'en_compra'].includes(solicitud.estado)) {
      const autorizada = solicitud.ordenes_compra.some(oc => ['AUTORIZADA', 'APROBADA', 'VERIFICADA'].includes(oc.estado.toUpperCase()));
      return autorizada ? 'Compra en proceso' : 'Compra pendiente';
    }
    if (solicitud.estado === 'recibida_parcial') return 'Recepción parcial';
    if (solicitud.estado === 'material_en_almacen') return 'Material en almacén';
    return `Compra ${this.etiqueta(solicitud.estado)}`;
  }
  get esIndiceEquipos() { return this.id === null && (this.recurso === 'maquinas' || this.recurso === 'vehiculos'); }
  get titulo() { return { maquinas: 'Máquinas', vehiculos: 'Vehículos', servicios: 'Servicios' }[this.recurso]; }
  get puedeCambiarPanel() { return this.auth.panelesDisponiblesValue.length > 1; }
  maquinaHorasId: number | null = null; avisoHoras = '';
  seleccionAsignacion: SeleccionAsignacionMaquina | null = null;
  maquinaUbicacionId: number | null = null;
  menuUbicacionId: number | null = null;
  abrirMenuUbicacion(id: number) {
    if (this.menuUbicacionId !== null || this.maquinaUbicacionId !== null || this.maquinaHorasId !== null || this.seleccionAsignacion) return;
    const usuario = this.auth.currentUserValue?.id; if (!usuario) return;
    const pendiente = this.asignaciones.pendiente(usuario, id);
    if (pendiente) { this.abrirAsignacion({maquinaId: id, accion: pendiente.accion}); return; }
    if (this.ubicacionPendiente(id)) { this.abrirUbicacion(id); return; }
    if (this.horasMaquina.pendiente(usuario, id)) { this.avisoHoras = 'Confirma primero la captura de horas pendiente.'; return; }
    this.menuUbicacionId = id; this.avisoHoras = '';
  }
  elegirOperacionUbicacion(seleccion: SeleccionMenuUbicacion) {
    this.menuUbicacionId = null;
    if (seleccion.accion === 'ubicacion') this.abrirUbicacion(seleccion.maquinaId);
    else this.abrirAsignacion({maquinaId: seleccion.maquinaId, accion: seleccion.accion});
  }
  get puedeCambiarUbicacion() { return this.auth.hasPermission('maquinas.ubicacion.update.access'); }
  get puedeAsignarObra() { return this.auth.hasPermission('maquinas.asignar_obra.access'); }
  get puedeRetirarObra() { return this.auth.hasPermission('baja_maquinas.access'); }
  get puedeCapturarHoras() { return this.auth.hasPermission('maquinas.horas.create.access'); }
  abrirHoras(id: number) {
    if (this.maquinaUbicacionId !== null || this.maquinaHorasId !== null || this.seleccionAsignacion || !this.puedeCapturarHoras) return;
    if (this.ubicacionPendiente(id)) { this.avisoHoras = 'Confirma primero el cambio de ubicación pendiente de esta máquina.'; return; }
    this.maquinaHorasId = id; this.avisoHoras = '';
  }
  ubicacionPendiente(id: number) {
    const usuario = this.auth.currentUserValue?.id;
    return !!usuario && !!this.ubicaciones.pendiente(usuario, id);
  }
  abrirUbicacion(id: number) {
    if (!this.puedeCambiarUbicacion || this.maquinaHorasId !== null || this.seleccionAsignacion || this.maquinaUbicacionId !== null) return;
    const usuario = this.auth.currentUserValue?.id;
    if (!usuario) return;
    if (this.asignaciones.pendiente(usuario, id) || this.horasMaquina.pendiente(usuario, id)) {
      this.avisoHoras = 'Confirma primero la captura de horas o asignación pendiente de esta máquina.'; return;
    }
    this.maquinaUbicacionId = id; this.avisoHoras = '';
  }
  aplicarUbicacion(data: ResultadoUbicacionMaquina) {
    this.refrescarMaquina(data); this.maquinaUbicacionId = null;
    this.avisoHoras = data.operacion.reutilizada ? 'Cambio confirmado. La ubicación de la máquina está actualizada.'
      : 'Ubicación actualizada correctamente.';
  }
  refrescarMaquina(data: OpcionesHorasMaquina) {
    const asignacion = data.asignacion_retiro ?? data.asignacion_activa;
    const maquina = { ...data.maquina, obra_activa: asignacion?.obra ?? null, asignada: !!asignacion };
    this.filas = this.filas.map(fila => fila.id === maquina.id ? { ...fila, ...maquina } : fila);
    if (this.equipo?.id === maquina.id) this.equipo = { ...this.equipo, ...maquina };
  }
  asignacionPendiente(id: number) {
    const usuario = this.auth.currentUserValue?.id;
    const pendiente = usuario ? this.asignaciones.pendiente(usuario, id) : null;
    if (!pendiente || (pendiente.accion === 'asignar' ? !this.puedeAsignarObra : !this.puedeRetirarObra)) return null;
    return pendiente.accion;
  }
  abrirAsignacion(seleccion: SeleccionAsignacionMaquina) {
    if (this.maquinaHorasId !== null || this.seleccionAsignacion || this.maquinaUbicacionId !== null) return;
    if (this.ubicacionPendiente(seleccion.maquinaId)) { this.avisoHoras = 'Confirma primero el cambio de ubicación pendiente de esta máquina.'; return; }
    if (seleccion.accion === 'asignar' ? !this.puedeAsignarObra : !this.puedeRetirarObra) return;
    this.seleccionAsignacion = { ...seleccion }; this.avisoHoras = '';
  }
  aplicarAsignacion(data: ResultadoAsignacionMaquina) {
    this.refrescarMaquina(data); this.seleccionAsignacion = null;
    this.avisoHoras = data.operacion.reutilizada ? 'Operación confirmada. Los datos de la máquina están actualizados.'
      : (data.operacion.tipo === 'asignacion_obra' ? 'Máquina asignada a la obra.' : 'Máquina retirada de la obra y enviada al patio.');
  }
  aplicarHoras(data: ResultadoHorasMaquina) {
    this.refrescarMaquina(data);
    this.avisoHoras = data.operacion.reutilizada ? 'Captura confirmada. Los datos de la máquina están actualizados.'
      : (data.operacion.tipo === 'registro_horas' ? 'Horas registradas correctamente.' : 'Horómetro ajustado correctamente.');
    this.maquinaHorasId = null;
  }
  @ViewChild(MecanicoOperacionesComponent) operacionesVista?: MecanicoOperacionesComponent;
  get bloquearRefresco() {
    const op = this.operacionesVista;
    return !!(this.maquinaHorasId || this.seleccionAsignacion || this.maquinaUbicacionId || this.menuUbicacionId ||
      (op && (op.ocupado || op.camara || op.envioIncierto || op.ejecucionIncierta ||
        op.cambiosMateriales || op.fotos.length || op.ejecucion)));
  }
  private cerrarCarga: (() => void) | null = null;
  async actualizar() {
    if (this.cargando || this.bloquearRefresco) return;
    const finalizar = this.loaderCorporativo.iniciar('Actualizando información…');
    this.cerrarCarga = finalizar;
    try { await this.cargar(this.meta?.current_page || 1); }
    finally {
      finalizar();
      if (this.cerrarCarga === finalizar) this.cerrarCarga = null;
    }
  }
  async refrescar(event: RefresherCustomEvent) {
    try { await this.actualizar(); }
    finally { await event.target.complete(); }
  }
  private regreso = false;
  ionViewDidLeave() { this.cerrarCarga?.(); this.cerrarCarga = null; this.regreso = true; }
  async ionViewWillEnter() { if (this.regreso) { this.regreso = false; await this.cargar(this.meta?.current_page || 1); } }
  ngOnInit() {
    combineLatest([this.route.data, this.route.paramMap]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([data, params]) => {
      this.recurso = data['recurso'] as RecursoMecanico;
      this.id = params.get('id') ? Number(params.get('id')) : null;
      this.maquinaHorasId = null; this.seleccionAsignacion = null; this.maquinaUbicacionId = null; this.menuUbicacionId = null; this.avisoHoras = '';
      this.reiniciarFiltros();
      void this.cargar();
    });
  }
  async cargar(pagina = 1) {
    const turno = ++this.secuencia;
    this.cargando = true; this.error = ''; this.meta = null; this.filas = []; this.servicio = null; this.equipo = null; this.historial = [];
    try {
      if (this.id !== null) {
        if (!Number.isInteger(this.id) || this.id < 1) throw new Error('El identificador no es válido.');
        const res = await firstValueFrom(this.consulta.detalle(this.recurso, this.id));
        if (turno !== this.secuencia) return;
        if (this.recurso === 'servicios') this.servicio = res.data as DetalleServicio;
        else {
          const data = res.data as DetalleEquipo;
          this.equipo = data.maquina
            ? { ...data.maquina, obra_activa: (data.asignacion_retiro ?? data.asignacion_activa)?.obra ?? null, asignada: !!(data.asignacion_retiro ?? data.asignacion_activa) }
            : data.vehiculo ?? null;
          this.historial = data.mantenimientos_recientes;
        }
      } else {
        const params: Record<string, string | number> = { page: pagina, q: this.busqueda };
        if (this.recurso === 'servicios') {
          if (!this.fechaValida(this.fechaDesde) || !this.fechaValida(this.fechaHasta)) throw new Error('Captura fechas válidas.');
          if (this.fechaDesde && this.fechaHasta && this.fechaHasta < this.fechaDesde) throw new Error('La fecha final no puede ser anterior a la inicial.');
          params['estatus'] = this.estatus; params['solo_mios'] = this.soloMios ? 1 : 0;
          if (this.fechaDesde) params['fecha_desde'] = this.fechaDesde;
          if (this.fechaHasta) params['fecha_hasta'] = this.fechaHasta;
          if (this.equipoTipo) params['equipo_tipo'] = this.equipoTipo;
          if (this.equipoId && this.equipoTipo) params[this.equipoTipo === 'maquinas' ? 'maquina_id' : 'vehiculo_id'] = this.equipoId;
        }
        const res = await firstValueFrom(this.consulta.listado(this.recurso, params));
        if (turno !== this.secuencia) return;
        this.filas = res.data; this.meta = res.meta;
      }
    } catch (error: any) {
      if (turno !== this.secuencia) return;
      this.error = error?.message || 'No se pudo cargar la información.';
      if (error?.status === 401) this.auth.logout();
      else if (error?.status === 403) {
        try { await firstValueFrom(this.auth.getMe()); this.auth.setSelectedPanel(null); await this.router.navigate(['/home']); }
        catch { this.auth.logout(); }
      }
    } finally { if (turno === this.secuencia) this.cargando = false; }
  }
  private fechaValida(valor: string): boolean {
    if (!valor) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const fecha = new Date(valor + 'T00:00:00Z');
    return !Number.isNaN(fecha.valueOf()) && fecha.toISOString().slice(0, 10) === valor;
  }
  private reiniciarFiltros() {
    this.busqueda = ''; this.estatus = ''; this.soloMios = false;
    this.fechaDesde = ''; this.fechaHasta = ''; this.equipoTipo = ''; this.equipoId = null; this.equipoSeleccionado = null;
    this.equipoBusqueda = ''; this.equipos = []; this.metaEquipos = null; this.errorEquipos = '';
    this.secuenciaEquipos++; this.cargandoEquipos = false;
  }
  limpiarFiltros() { this.reiniciarFiltros(); void this.cargar(); }
  cambiarTipoEquipo() {
    this.equipoId = null; this.equipoSeleccionado = null; this.equipoBusqueda = ''; this.equipos = []; this.metaEquipos = null;
    this.secuenciaEquipos++; this.errorEquipos = ''; this.cargandoEquipos = false;
    if (this.equipoTipo) void this.cargarEquipos();
    void this.cargar();
  }
  seleccionarEquipo() {
    this.equipoSeleccionado = this.equipoId === null ? null : this.equipos.find(e => e.id === this.equipoId) ?? this.equipoSeleccionado;
    void this.cargar();
  }
  async cargarEquipos(pagina = 1) {
    if (!this.equipoTipo) return;
    const turno = ++this.secuenciaEquipos;
    this.cargandoEquipos = true; this.errorEquipos = ''; this.equipos = []; this.metaEquipos = null;
    try {
      const res = await firstValueFrom(this.consulta.listado(this.equipoTipo, { page: pagina, q: this.equipoBusqueda }));
      if (turno !== this.secuenciaEquipos) return;
      this.equipos = res.data; this.metaEquipos = res.meta;
    } catch (error: any) {
      if (turno !== this.secuenciaEquipos) return;
      this.errorEquipos = error?.message || 'No se pudieron buscar los equipos.';
      if (error?.status === 401) this.auth.logout();
    } finally { if (turno === this.secuenciaEquipos) this.cargandoEquipos = false; }
  }
  tipoServicio(fila: FilaMecanico): string {
    const tipo = fila.servicio_preventivo;
    if (!tipo?.nombre) return fila.servicio_preventivo_tipo_id ? 'Tipo de servicio no disponible' : 'Sin tipo de servicio asignado';
    if (tipo.intervalo_valor == null || tipo.intervalo_valor <= 0 || !tipo.unidad) return tipo.nombre;
    const intervalo = new Intl.NumberFormat('es-MX').format(tipo.intervalo_valor);
    const unidad = tipo.unidad === 'horas' ? 'h' : tipo.unidad;
    return `${tipo.nombre} · cada ${intervalo} ${unidad}`;
  }
  nombre(fila: FilaMecanico) {
    return fila.nombre || [fila.marca, fila.modelo].filter(Boolean).join(' ') || fila.categoria_mantenimiento || `Servicio #${fila.id}`;
  }
  etiqueta(valor: string | null | undefined) { return (valor || 'Sin estado').replace(/_/g, ' '); }
  async salir() {
    const confirmacion = await this.alert.create({ header: 'Cerrar sesión', message: '¿Quieres salir del sistema?',
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Salir', handler: () => this.auth.logout() }] });
    await confirmacion.present();
  }
}
