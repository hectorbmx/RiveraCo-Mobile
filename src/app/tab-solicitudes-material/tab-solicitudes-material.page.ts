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
  LoadingController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, checkmarkCircleOutline, closeCircleOutline, documentTextOutline, hourglassOutline, refreshOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { CompanyLoadingOverlayComponent } from '../shared/company-loading-overlay/company-loading-overlay.component';
import { ObraCivilMaterialService, ObraCivilMaterialSolicitudResumen } from '../services/obra-civil-material';

@Component({
  selector: 'app-tab-solicitudes-material',
  templateUrl: './tab-solicitudes-material.page.html',
  styleUrls: ['./tab-solicitudes-material.page.scss'],
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
export class TabSolicitudesMaterialPage implements OnInit {
  loading = false;
  loadingMore = false;
  page = 1;
  hasMore = false;
  total = 0;
  solicitudes: ObraCivilMaterialSolicitudResumen[] = [];
  expanded: Record<number, boolean> = {};

  constructor(
    private materialService: ObraCivilMaterialService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      documentTextOutline,
      hourglassOutline,
      refreshOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit(): void {
    this.loadSolicitudes(true);
  }

  ionViewWillEnter(): void {
    this.loadSolicitudes(true);
  }

  async loadSolicitudes(reset = false): Promise<void> {
    if (reset) {
      this.page = 1;
      this.hasMore = false;
    }

    if (this.loading || this.loadingMore) {
      return;
    }

    this.loading = reset;
    this.loadingMore = !reset;

    try {
      const res = await firstValueFrom(this.materialService.solicitudes({
        page: this.page,
        per_page: 20,
      }));

      const data = res.data ?? [];
      this.solicitudes = reset ? data : [...this.solicitudes, ...data];
      this.hasMore = Boolean(res.meta?.has_more);
      this.total = Number(res.meta?.total || this.solicitudes.length);
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudieron cargar tus solicitudes', 'danger');
    } finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }

  async loadMore(): Promise<void> {
    if (!this.hasMore) return;
    this.page += 1;
    await this.loadSolicitudes(false);
  }

  async doRefresh(event: any): Promise<void> {
    try {
      await this.loadSolicitudes(true);
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
    const normalized = String(status || '').replace(/_/g, ' ').toUpperCase();
    return normalized || 'SIN ESTADO';
  }

  statusColor(status: string | null | undefined): string {
    switch (status) {
      case 'aprobada':
      case 'aprobada_parcial':
        return 'success';
      case 'rechazada':
      case 'cancelada':
        return 'danger';
      case 'convertida_a_oc':
        return 'primary';
      default:
        return 'warning';
    }
  }

  ocResumen(solicitud: ObraCivilMaterialSolicitudResumen): string {
    if (!solicitud.has_purchase_order) {
      return 'Sin orden de compra';
    }

    if (solicitud.has_final_purchase_order) {
      return 'Con OC autorizada/verificada';
    }

    if (solicitud.has_draft_purchase_order) {
      return 'Con OC en borrador';
    }

    return 'Con orden de compra';
  }

  ocColor(solicitud: ObraCivilMaterialSolicitudResumen): string {
    if (solicitud.has_final_purchase_order) return 'success';
    if (solicitud.has_draft_purchase_order) return 'warning';
    if (solicitud.has_purchase_order) return 'primary';
    return 'medium';
  }

  itemConcepto(item: any): string {
    return item?.insumo?.concepto || item?.insumo_snapshot?.concepto || 'Material';
  }

  itemCodigo(item: any): string {
    return item?.insumo?.codigo || item?.insumo_snapshot?.codigo || 'S/C';
  }

  itemUnidad(item: any): string {
    return item?.unit || item?.insumo?.unidad || item?.insumo_snapshot?.unidad || '';
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




