import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { IonButton, IonIcon, IonBadge, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonSpinner, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import type { RefresherCustomEvent } from '@ionic/core';
import { addIcons } from 'ionicons';
import { notificationsOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api';
import { MecanicoLoadingService } from '../../services/mecanico-loading.service';

interface Notificacion { id: string; titulo: string; mensaje: string; creada: string | null; leida: string | null; destino: { tipo: 'maquina' | 'vehiculo'; id: number } | null; }
interface Respuesta { ok: boolean; data: Notificacion[]; meta: { current_page: number; last_page: number; total: number; sin_leer: number }; }
@Component({ selector: 'app-notificaciones', standalone: true,
  imports: [CommonModule, IonButton, IonIcon, IonBadge, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonSpinner, IonRefresher, IonRefresherContent],
  templateUrl: './app-notificaciones.component.html', styleUrls: ['./app-notificaciones.component.scss'] })
export class AppNotificacionesComponent implements OnInit, OnDestroy {
  @Input() clara = false;
  abierta = false; cargando = false; error = ''; pagina = 1; ultima = 1;
  sinLeer: number | null = null; filas: Notificacion[] = []; leyendo = new Set<string>();
  private secuencia = 0;
  private temporizador?: ReturnType<typeof setInterval>;
  private navegacion?: Subscription;
  private actualizarAlVolver = () => { if (!document.hidden && !this.abierta) void this.actualizarContador(); };
  constructor(private api: ApiService, private loader: MecanicoLoadingService, private router: Router) { addIcons({ notificationsOutline }); }
  ngOnInit() {
    void this.actualizarContador();
    this.navegacion = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => this.actualizarAlVolver());
    document.addEventListener('visibilitychange', this.actualizarAlVolver);
    this.temporizador = setInterval(() => this.actualizarAlVolver(), 60000);
  }
  ngOnDestroy() {
    this.secuencia++; this.navegacion?.unsubscribe();
    document.removeEventListener('visibilitychange', this.actualizarAlVolver);
    if (this.temporizador) clearInterval(this.temporizador);
  }
  private async actualizarContador() {
    try {
      const res = await firstValueFrom(this.api.get<Respuesta>('app/notificaciones', { page: 1, per_page: 1 }));
      if (!this.abierta) this.sinLeer = res.meta.sin_leer;
    } catch { /* La consulta de la campana mostrará el error al abrirla. */ }
  }
  async verEquipo(n: Notificacion) {
    if (!n.destino) return;
    if (!n.leida) await this.leer(n);
    const gerencial = this.router.url.startsWith('/tabs-gerencial');
    const base = gerencial ? '/tabs-gerencial' : '/tabs-mecanico';
    const recurso = n.destino.tipo === 'vehiculo' ? 'vehiculos' : (gerencial ? 'maquina-detalles' : 'maquinas');
    this.cerrar();
    await this.router.navigate([base, recurso, n.destino.id]);
  }
  abrir() { this.abierta = true; void this.cargar(1); }
  cerrar() { this.abierta = false; this.secuencia++; this.cargando = false; }
  async cargar(page = 1) {
    const turno = ++this.secuencia; this.cargando = true; this.error = '';
    try {
      const res = await firstValueFrom(this.api.get<Respuesta>('app/notificaciones', { page }));
      if (turno !== this.secuencia) return;
      this.filas = res.data; this.pagina = res.meta.current_page; this.ultima = res.meta.last_page; this.sinLeer = res.meta.sin_leer;
    } catch { if (turno === this.secuencia) this.error = 'No se pudieron consultar las notificaciones.'; }
    finally { if (turno === this.secuencia) this.cargando = false; }
  }
  async refrescar(event: RefresherCustomEvent) {
    const finalizar = this.loader.iniciar('Actualizando notificaciones…');
    try { await this.cargar(1); } finally { finalizar(); await event.target.complete(); }
  }
  async leer(n: Notificacion) {
    if (n.leida || this.leyendo.has(n.id)) return;
    const turno = this.secuencia; this.leyendo.add(n.id);
    try {
      await firstValueFrom(this.api.post('app/notificaciones/' + encodeURIComponent(n.id) + '/leer', {}));
      if (turno !== this.secuencia) return;
      n.leida = new Date().toISOString(); this.sinLeer = Math.max(0, (this.sinLeer || 0) - 1);
    } catch { if (turno === this.secuencia) this.error = 'No se pudo marcar la notificación como leída.'; }
    finally { this.leyendo.delete(n.id); }
  }
}
