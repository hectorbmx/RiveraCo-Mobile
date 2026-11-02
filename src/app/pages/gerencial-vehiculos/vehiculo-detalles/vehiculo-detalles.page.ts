import { AppNotificacionesComponent } from 'src/app/components/app-notificaciones/app-notificaciones.component';
import { MecanicoLoadingService } from 'src/app/services/mecanico-loading.service';
import type { RefresherCustomEvent } from '@ionic/core';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonBackButton, IonButtons, IonContent, IonRefresher, IonRefresherContent, IonSpinner, IonHeader, IonToolbar, IonTitle, IonButton, AlertController } from '@ionic/angular/standalone';
import { Observable, Subscription, firstValueFrom, finalize } from 'rxjs';
import { ProfileMenuComponent } from 'src/app/components/profile-menu/profile-menu.component';
import { VehiculoFichaDetalleDto, VehiculoHistorialResponse, VehiculoAsignacionDto, VehiculoServicioDto,
  VehiculoSeguroDto, VehiculoCombustibleRegistroDto, VehiculoSalidaDto } from 'src/app/models/vehiculo.model';
import { VehiculoDetalleConsultaService, PanelConsultaVehiculo } from 'src/app/services/vehiculo-detalle-consulta.service';
import { AuthService } from 'src/app/services/auth';
import { EstadoHistorial, HistorialVista, nuevoHistorial, VehiculoHistorialComponent } from './vehiculo-historial.component';

import { VehiculoAdjuntoComponent } from './vehiculo-adjunto.component';

type Seccion = 'asignaciones' | 'servicios' | 'seguros' | 'registros' | 'almacen';
@Component({
  selector: 'app-vehiculo-detalles', standalone: true,
  host: { '[class.panel-mecanico]': "panel === 'mecanico'" },
  imports: [AppNotificacionesComponent, CommonModule, RouterModule, IonBackButton, IonButtons, IonContent, IonRefresher, IonRefresherContent, IonSpinner,
    ProfileMenuComponent, VehiculoHistorialComponent, VehiculoAdjuntoComponent, IonHeader, IonToolbar, IonTitle, IonButton],
  templateUrl: './vehiculo-detalles.page.html',
  styleUrls: ['../gerencial-vehiculos.page.scss', './vehiculo-detalles.page.scss']
})
export class VehiculoDetallesPage implements OnDestroy {
  detalle: VehiculoFichaDetalleDto | null = null;
  panel: PanelConsultaVehiculo;
  get rutaListado() { return this.panel === 'mecanico' ? '/tabs-mecanico/vehiculos' : '/tabs-gerencial/vehiculos'; }
  refrescando = false;
  private secuenciaRefresco = 0;
  fichaExpandida = true;
  loading = false;
  error = '';
  id = 0;
  asignaciones = nuevoHistorial<VehiculoAsignacionDto>();
  servicios = nuevoHistorial<VehiculoServicioDto>();
  seguros = nuevoHistorial<VehiculoSeguroDto>();
  registros = nuevoHistorial<VehiculoCombustibleRegistroDto>();
  almacen = nuevoHistorial<VehiculoSalidaDto>();
  private secciones: Record<Seccion, HistorialVista> = {
    asignaciones: this.asignaciones, servicios: this.servicios, seguros: this.seguros,
    registros: this.registros, almacen: this.almacen
  };
  private consultas = new Map<string, Subscription>();
  private filtrosAplicados = new Map<Seccion, string>();
  estadosServicio = [
    { valor: 'borrador', nombre: 'Borrador' }, { valor: 'orden_generada', nombre: 'Orden generada' },
    { valor: 'pendiente', nombre: 'Pendiente' }, { valor: 'en_proceso', nombre: 'En proceso' },
    { valor: 'completado', nombre: 'Completado' }, { valor: 'cancelado', nombre: 'Cancelado' }
  ];
  estadosSeguro = [
    { valor: 'vigente', nombre: 'Vigente' }, { valor: 'futura', nombre: 'Futura' },
    { valor: 'vencida', nombre: 'Vencida' }, { valor: 'cancelada', nombre: 'Cancelada' }
  ];
  constructor(private route: ActivatedRoute, private api: VehiculoDetalleConsultaService,
    public auth: AuthService, private alert: AlertController, private loaderCorporativo: MecanicoLoadingService) {
    this.panel = route.snapshot.data['panel'] === 'mecanico' ? 'mecanico' : 'gerencial';
  }
  async salir() {
    const confirmacion = await this.alert.create({ header: 'Cerrar sesión', message: '¿Quieres salir del sistema?',
      buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Salir', handler: () => this.auth.logout() }] });
    await confirmacion.present();
  }
  ionViewWillEnter() { this.cargar(); }
  ionViewWillLeave() { this.cancelar(); }
  ngOnDestroy() { this.cancelar(); }
  private cancelar() { this.cerrarCarga?.(); this.cerrarCarga = null; this.secuenciaRefresco++; this.refrescando = false; this.consultas.forEach(s => s.unsubscribe()); this.consultas.clear(); }

  cargar() {
    this.fichaExpandida = true;
    this.cancelar();
    this.filtrosAplicados.clear();
    this.detalle = null;
    this.error = '';
    Object.values(this.secciones).forEach(s => Object.assign(s, nuevoHistorial()));
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(this.id) || this.id <= 0) {
      this.loading = false; this.error = 'Selecciona un vehículo desde el listado.'; return;
    }
    this.loading = true;
    this.consultas.set('detalle', this.api.getDetalle(this.id, this.panel).subscribe({
      next: res => {
        this.loading = false;
        if (!res.ok || !res.data?.vehiculo) { this.error = 'No se encontró la información del vehículo.'; return; }
        this.detalle = res.data;
      },
      error: err => { this.loading = false; this.error = this.mensajeError(err); }
    }));
  }

  private cerrarCarga: (() => void) | null = null;
  async refrescar(event: RefresherCustomEvent) {
    try { await this.actualizar(); }
    finally { await event.target.complete(); }
  }
  async actualizar() {
    if (this.loading || this.refrescando || !this.id) return;
    const finalizar = this.loaderCorporativo.iniciar('Actualizando vehículo e historiales…');
    this.cerrarCarga = finalizar;
    const turno = this.secuenciaRefresco;
    try {
      this.refrescando = true;
      const res = await firstValueFrom(this.api.getDetalle(this.id, this.panel));
      if (turno !== this.secuenciaRefresco) return;
      if (!res.ok || !res.data?.vehiculo) { this.error = 'No se encontró la información del vehículo.'; return; }
      this.detalle = res.data;
      this.error = '';
      await Promise.all((Object.keys(this.secciones) as Seccion[])
        .filter(clave => this.secciones[clave].abierto)
        .map(clave => this.cargarHistorial(clave, this.secciones[clave].meta?.current_page || 1)));
      if (turno !== this.secuenciaRefresco) return;
      // Closed histories are reloaded the next time they are opened.
      (Object.keys(this.secciones) as Seccion[]).filter(clave => !this.secciones[clave].abierto)
        .forEach(clave => { this.secciones[clave].consultado = false; });
    } catch (err) {
      if (turno === this.secuenciaRefresco) this.error = this.mensajeError(err as { status?: number });
    } finally {
      if (turno === this.secuenciaRefresco) this.refrescando = false;
      finalizar();
      if (this.cerrarCarga === finalizar) this.cerrarCarga = null;
    }
  }

  abrir(clave: Seccion, abierto: boolean) {
    const s = this.secciones[clave]; s.abierto = abierto;
    if (abierto && !s.consultado && !s.loading) this.cargarHistorial(clave, s.meta?.current_page || 1);
  }

  cargarHistorial(clave: Seccion, page = 1) {
    if (!this.detalle) return;
    const s = this.secciones[clave];
    this.consultas.get(clave)?.unsubscribe();
    s.loading = false;
    if (s.desde && s.hasta && s.hasta < s.desde) {
      s.error = 'La fecha final debe ser igual o posterior a la inicial.'; return;
    }
    const firma = JSON.stringify([s.desde, s.hasta, s.estatus]);
    if (this.filtrosAplicados.get(clave) !== firma) {
      page = 1; s.meta = null;
    }
    this.filtrosAplicados.set(clave, firma);
    s.paginaSolicitada = page;
    const filtros = { page, per_page: 20, desde: s.desde || undefined, hasta: s.hasta || undefined,
      estatus: s.estatus || undefined };
    switch (clave) {
      case 'asignaciones': return this.consultar(clave, this.asignaciones, this.api.getAsignaciones(this.id, filtros, this.panel));
      case 'servicios': return this.consultar(clave, this.servicios, this.api.getServicios(this.id, filtros, this.panel));
      case 'seguros': return this.consultar(clave, this.seguros, this.api.getSeguros(this.id, filtros, this.panel));
      case 'registros': return this.consultar(clave, this.registros, this.api.getRegistrosCombustible(this.id, filtros, this.panel));
      case 'almacen': return this.consultar(clave, this.almacen, this.api.getSalidas(this.id, filtros, this.panel));
    }
  }

  private consultar<T>(clave: Seccion, s: EstadoHistorial<T>, consulta: Observable<VehiculoHistorialResponse<T>>) {
    s.loading = true; s.error = '';
    return new Promise<void>(resolve => {
    this.consultas.set(clave, consulta.pipe(finalize(() => resolve())).subscribe({
      next: res => {
        s.loading = false;
        if (!res.ok || !Array.isArray(res.data) || !res.meta) { s.error = 'La respuesta del historial no es válida.'; return; }
        s.data = res.data; s.meta = res.meta; s.consultado = true;
      },
      error: err => { s.loading = false; s.error = this.mensajeError(err); }
    }));
    });
  }

  private mensajeError(err: { status?: number; error?: { errors?: Record<string, string[]> } }): string {
    if (err.status === 401) return 'La sesión terminó. Vuelve a ingresar.';
    if (err.status === 403) return 'No tienes acceso a esta información.';
    if (err.status === 404) return 'No se encontró el vehículo o la consulta no está disponible.';
    if (err.status === 422) return Object.values(err.error?.errors || {}).reduce((todos, mensajes) => todos.concat(mensajes), [] as string[]).join(' ') || 'Revisa los filtros de la consulta.';
    return 'No se pudo cargar la información. Intenta nuevamente.';
  }
  nombre(): string {
    const v = this.detalle?.vehiculo;
    return v ? [v.marca, v.modelo, v.anio].filter(Boolean).join(' ') || 'Vehículo sin nombre' : 'Vehículo';
  }
  fechaCivil(fecha: string | null | undefined): string {
    if (!fecha) return 'Sin fecha';
    const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    return p ? `${p[3]}/${p[2]}/${p[1]}` : 'Sin fecha';
  }
  etiqueta(valor: string | null | undefined): string {
    const etiquetas: Record<string, string> = {
      borrador: 'Borrador', orden_generada: 'Orden generada', pendiente: 'Pendiente', en_proceso: 'En proceso',
      completado: 'Completado', cancelado: 'Cancelado', futura: 'Futura', vigente: 'Vigente', vencida: 'Vencida',
      cancelada: 'Cancelada', preventivo: 'Preventivo', correctivo: 'Correctivo', programado: 'Programado',
      app: 'App móvil', web: 'Web', web_residente: 'Web residente', aplicado: 'Aplicado'
    };
    return valor ? etiquetas[valor] || valor.replace(/_/g, ' ') : 'Sin registro';
  }
}
