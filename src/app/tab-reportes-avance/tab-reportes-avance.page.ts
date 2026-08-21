import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, barChartOutline, cameraOutline, createOutline, hourglassOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { CompanyLoadingOverlayComponent } from '../shared/company-loading-overlay/company-loading-overlay.component';
import { ObraCivilAvanceReporteItem, ObraCivilAvanceReporteResumen, ObraCivilAvanceService } from '../services/obra-civil-avance';

@Component({
  selector: 'app-tab-reportes-avance',
  templateUrl: './tab-reportes-avance.page.html',
  styleUrls: ['./tab-reportes-avance.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CompanyLoadingOverlayComponent,
    RouterLink,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class TabReportesAvancePage implements OnInit {
  loading = false;
  loadingMore = false;
  page = 1;
  hasMore = false;
  total = 0;
  reportes: ObraCivilAvanceReporteResumen[] = [];
  expanded: Record<number, boolean> = {};

  constructor(
    private avanceService: ObraCivilAvanceService,
    private toastCtrl: ToastController,
  ) {
    addIcons({ arrowBackOutline, barChartOutline, cameraOutline, createOutline, hourglassOutline });
  }

  ngOnInit(): void {
    this.loadReportes(true);
  }

  ionViewWillEnter(): void {
    this.loadReportes(true);
  }

  async loadReportes(reset = false): Promise<void> {
    if (reset) {
      this.page = 1;
      this.hasMore = false;
    }

    if (this.loading || this.loadingMore) return;

    this.loading = reset;
    this.loadingMore = !reset;

    try {
      const res = await firstValueFrom(this.avanceService.reportes({
        page: this.page,
        per_page: 20,
      }));

      const data = res.data ?? [];
      this.reportes = reset ? data : [...this.reportes, ...data];
      this.hasMore = Boolean(res.meta?.has_more);
      this.total = Number(res.meta?.total || this.reportes.length);
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudieron cargar tus reportes', 'danger');
    } finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }

  async loadMore(): Promise<void> {
    if (!this.hasMore) return;
    this.page += 1;
    await this.loadReportes(false);
  }

  async doRefresh(event: any): Promise<void> {
    try {
      await this.loadReportes(true);
    } finally {
      event?.target?.complete();
    }
  }

  toggle(id: number): void {
    this.expanded[id] = !this.expanded[id];
  }

  isExpanded(id: number): boolean {
    return Boolean(this.expanded[id]);
  }

  statusLabel(status: string | null | undefined): string {
    return String(status || 'pendiente').replace(/_/g, ' ').toUpperCase();
  }

  statusColor(status: string | null | undefined): string {
    switch (status) {
      case 'aprobado':
      case 'convertido_a_estimacion':
        return 'success';
      case 'rechazado':
        return 'danger';
      case 'en_revision':
        return 'warning';
      default:
        return 'medium';
    }
  }

  conceptoClave(item: ObraCivilAvanceReporteItem): string {
    return item.concept_snapshot?.clave || 'S/C';
  }

  conceptoDescripcion(item: ObraCivilAvanceReporteItem): string {
    return item.concept_snapshot?.descripcion || 'Concepto reportado';
  }

  conceptoRuta(item: ObraCivilAvanceReporteItem): string {
    const edificio = item.concept_snapshot?.edificio || 'Edificio';
    const partida = item.concept_snapshot?.partida;
    const partidaTexto = typeof partida === 'object'
      ? [partida?.code, partida?.name].filter(Boolean).join(' ')
      : partida;

    return `${edificio} / ${partidaTexto || 'Partida'}`;
  }

  photosCount(reporte: ObraCivilAvanceReporteResumen): number {
    return reporte.items.reduce((sum, item) => sum + (item.photos?.length || 0), 0);
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'medium'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2600,
      color,
      position: 'bottom',
    });

    await toast.present();
  }
}

