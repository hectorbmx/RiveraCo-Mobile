import { DestroyRef as RefreshDestroyRef, inject as refreshInject } from '@angular/core';
import type { RefresherCustomEvent } from '@ionic/core';
import { RefrescoConsultaService } from 'src/app/services/refresco-consulta.service';
import { IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonBackButton, IonButtons, IonContent, IonSpinner } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { ProfileMenuComponent } from 'src/app/components/profile-menu/profile-menu.component';
import { MaquinaDetalleDto, MaquinaListItemDto, PreventivoMaquinaDto } from 'src/app/models/maquina.model';
import { MaquinasGerencialService } from 'src/app/services/gerencial-maquina.service';

@Component({
  selector: 'app-maquina-detalles',
  templateUrl: './maquina-detalles.page.html',
  styleUrls: ['../gerencial-maquinas.page.scss', './maquina-detalles.page.scss'],
  standalone: true,
  imports: [IonRefresher, IonRefresherContent, CommonModule, RouterModule, IonBackButton, IonButtons, IonContent, IonSpinner, ProfileMenuComponent]
})
export class MaquinaDetallesPage implements OnDestroy {
  private refrescoApp = refreshInject(RefrescoConsultaService);
  private destroyRefrescoApp = refreshInject(RefreshDestroyRef);
  refrescarApp(event: RefresherCustomEvent) {
    if (this.loading) { void event.target.complete(); return; }
    this.refrescoApp.ejecutar(event, completar => { this.cargar(completar); }, this.destroyRefrescoApp);
  }

  detalle: MaquinaDetalleDto | null = null;
  maquina: MaquinaListItemDto | null = null;
  loading = false;
  error = '';
  asignacionPendiente = false;
  private consulta?: Subscription;

  constructor(private route: ActivatedRoute, private maquinasSvc: MaquinasGerencialService) {}

  ionViewWillEnter() { this.cargar(); }

  ngOnDestroy() { this.consulta?.unsubscribe(); }

  cargar(_completado: () => void = () => {}) {
    this.consulta?.unsubscribe();
    this.detalle = null;
    this.maquina = null;
    this.asignacionPendiente = false;
    this.error = '';
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.loading = false;
      this.error = 'Selecciona una máquina desde el listado gerencial.'; _completado();
      return;
    }
    this.loading = true;
    this.consulta = this.maquinasSvc.getMaquinaById(id).pipe(finalize(_completado)).subscribe({
      next: (res) => {
        if (!res.ok || !res.data?.maquina) {
          this.error = 'No se encontró la información de la máquina.';
          this.loading = false;
          return;
        }
        this.detalle = res.data;
        // Keep legacy assignments visible, without presenting them as a valid current worksite.
        const asignacion = res.data.asignacion_activa ?? res.data.asignacion_retiro;
        this.asignacionPendiente = !res.data.asignacion_activa && !!res.data.asignacion_retiro;
        this.maquina = { ...res.data.maquina, asignada: !!asignacion, obra_activa: asignacion?.obra ?? null };
        this.loading = false;
      },
      error: (err: { status?: number }) => {
        this.error = err.status === 404 ? 'No se encontró la máquina.' :
          err.status === 403 ? 'No tienes acceso a esta máquina.' : 'No se pudo cargar el detalle de la máquina.';
        this.loading = false;
      }
    });
  }

  etiqueta(valor: string | null | undefined): string {
    const etiquetas: Record<string, string> = {
      operativa: 'Operativa', fuera_servicio: 'Fuera de servicio', fuera_de_servicio: 'Fuera de servicio',
      baja_definitiva: 'Baja definitiva', baja: 'Baja', mantenimiento: 'Mantenimiento',
      en_reparacion: 'En reparación', en_obra: 'En obra', en_camino: 'En camino', en_patio: 'En patio', preventivo: 'Preventivo', correctivo: 'Correctivo', programado: 'Programado',
      pendiente: 'Pendiente', borrador: 'Borrador', en_proceso: 'En proceso', completado: 'Completado',
      cancelado: 'Cancelado', orden_generada: 'Orden generada'
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

}
