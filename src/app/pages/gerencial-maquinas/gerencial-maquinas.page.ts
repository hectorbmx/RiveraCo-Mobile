import { DestroyRef as RefreshDestroyRef, inject as refreshInject } from '@angular/core';
import type { RefresherCustomEvent } from '@ionic/core';
import { RefrescoConsultaService } from 'src/app/services/refresco-consulta.service';
import { IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonContent, IonIcon, IonSearchbar, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, bus, chevronForward, construct, settings } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { ProfileMenuComponent } from 'src/app/components/profile-menu/profile-menu.component';
import { MaquinaListItemDto, PreventivoMaquinaDto } from 'src/app/models/maquina.model';
import { MaquinasGerencialService } from 'src/app/services/gerencial-maquina.service';

@Component({
  selector: 'app-gerencial-maquinas',
  templateUrl: './gerencial-maquinas.page.html',
  styleUrls: ['./gerencial-maquinas.page.scss'],
  standalone: true,
  imports: [IonRefresher, IonRefresherContent, CommonModule, FormsModule, IonContent, ProfileMenuComponent, RouterModule,
    IonSearchbar, IonIcon, IonSpinner]
})
export class GerencialMaquinasPage implements OnInit, OnDestroy {
  private refrescoApp = refreshInject(RefrescoConsultaService);
  private destroyRefrescoApp = refreshInject(RefreshDestroyRef);
  refrescarApp(event: RefresherCustomEvent) {
    if (this.loading) { void event.target.complete(); return; }
    this.refrescoApp.ejecutar(event, completar => { this.cargarMaquinas(false, completar); }, this.destroyRefrescoApp);
  }

  maquinas: MaquinaListItemDto[] = [];
  loading = false;
  loadingMore = false;
  searchTerm = '';
  enUso = false;
  currentPage = 0;
  lastPage = 0;
  total = 0;
  error = '';
  private consulta?: Subscription;

  constructor(private maquinasSvc: MaquinasGerencialService, private route: ActivatedRoute) {
    addIcons({ chevronForward, alertCircleOutline, construct, bus, settings });
  }

  ngOnInit() {
    this.syncFiltersFromRoute();
  }

  ionViewWillEnter() {
    this.syncFiltersFromRoute();
    this.cargarMaquinas();
  }

  ngOnDestroy() {
    this.consulta?.unsubscribe();
  }

  private syncFiltersFromRoute() {
    this.enUso = this.route.snapshot.queryParamMap.get('en_uso') === '1';
  }

  cargarMaquinas(append = false, _completado: () => void = () => {}) {
    if (append && (this.loading || this.loadingMore || this.currentPage >= this.lastPage)) return;
    this.consulta?.unsubscribe();
    this.loading = !append;
    this.loadingMore = append;
    this.error = '';
    const page = append ? this.currentPage + 1 : 1;
    this.consulta = this.maquinasSvc.getMaquinas(page, this.searchTerm.trim() || undefined, this.enUso)
      .pipe(finalize(_completado)).subscribe({
        next: (res) => {
          const filas = append ? [...this.maquinas, ...res.data.data] : res.data.data;
          this.maquinas = [...new Map(filas.map(m => [m.id, m])).values()].sort((a, b) =>
            (a.codigo ?? '').localeCompare(b.codigo ?? '', 'es', { numeric: true }) ||
            (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es'));
          this.currentPage = res.data.current_page;
          this.lastPage = res.data.last_page;
          this.total = res.data.total;
          this.loading = this.loadingMore = false;
        },
        error: () => {
          this.error = append ? 'No se pudieron cargar más máquinas.' : 'No se pudo cargar la maquinaria.';
          if (!append) {
            this.maquinas = [];
            this.currentPage = this.lastPage = this.total = 0;
          }
          this.loading = this.loadingMore = false;
        }
      });
  }

  onSearchChange(value: string | null | undefined) {
    this.searchTerm = value || '';
    this.cargarMaquinas();
  }

  trackMaquina(_index: number, maquina: MaquinaListItemDto) { return maquina.id; }

  etiqueta(valor: string | null | undefined): string {
    const etiquetas: Record<string, string> = {
      operativa: 'Operativa', fuera_servicio: 'Fuera de servicio', fuera_de_servicio: 'Fuera de servicio',
      baja_definitiva: 'Baja definitiva', baja: 'Baja', mantenimiento: 'Mantenimiento',
      en_reparacion: 'En reparación', en_obra: 'En obra', en_camino: 'En camino', en_patio: 'En patio'
    };
    return valor ? etiquetas[valor] || valor.replace(/_/g, ' ') : 'Sin estado';
  }

  estadoPreventivo(p: PreventivoMaquinaDto): string {
    return { sin_datos: 'Sin datos', ok: 'Al día', proximo: 'Próximo', vencido: 'Vencido' }[p.estado] || 'Sin datos';
  }

  progreso(p: PreventivoMaquinaDto): number {
    return Number.isFinite(p.porcentaje) ? Math.min(100, Math.max(0, p.porcentaje)) : 0;
  }

  fechaCivil(fecha: string): string {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : 'Sin fecha';
  }

  identidad(m: MaquinaListItemDto): string {
    return [m.marca, m.modelo, m.tipo].filter(Boolean).join(' · ');
  }

  getIconForTipo(tipo: string | null): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('bore') || t.includes('perforadora')) return 'construct';
    if (t.includes('camion') || t.includes('transporte')) return 'bus';
    return 'settings';
  }
}
