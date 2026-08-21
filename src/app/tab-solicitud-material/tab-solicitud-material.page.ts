import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
  IonInput,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  LoadingController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, documentTextOutline, refreshOutline, searchOutline, sendOutline, trashOutline } from 'ionicons/icons';
import { Subject, Subscription, debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { CompanyLoadingOverlayComponent } from '../shared/company-loading-overlay/company-loading-overlay.component';
import { AuthService, Contexto } from '../services/auth';
import { ObraCivilMaterial, ObraCivilMaterialService } from '../services/obra-civil-material';

interface MaterialCartItem {
  material: ObraCivilMaterial;
  quantity: number;
  notes: string;
}

@Component({
  selector: 'app-tab-solicitud-material',
  templateUrl: './tab-solicitud-material.page.html',
  styleUrls: ['./tab-solicitud-material.page.scss'],
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
    IonInput,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class TabSolicitudMaterialPage implements OnInit, OnDestroy {
  contexto: Contexto | null = null;
  loading = false;
  loadingMore = false;
  query = '';
  page = 1;
  hasMore = false;
  materiales: ObraCivilMaterial[] = [];
  selected: ObraCivilMaterial | null = null;
  modalOpen = false;
  quantity: number | null = null;
  itemNotes = '';
  requestNotes = '';
  cart: MaterialCartItem[] = [];

  private contextoSub?: Subscription;
  private searchSub?: Subscription;
  private search$ = new Subject<string>();

  constructor(
    private authService: AuthService,
    private materialService: ObraCivilMaterialService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ addCircleOutline, documentTextOutline, refreshOutline, searchOutline, sendOutline, trashOutline });
  }

  ngOnInit(): void {
    this.contexto = this.authService.contextoValue;
    this.contextoSub = this.authService.contexto$.subscribe((contexto) => {
      this.contexto = contexto;
    });

    this.searchSub = this.search$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((value) => {
        this.query = value;
        this.loadCatalog(true);
      });

    this.loadCatalog(true);
  }

  ionViewWillEnter(): void {
    this.loadCatalog(true);
  }

  ngOnDestroy(): void {
    this.contextoSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  get obra() {
    return this.contexto?.obra ?? null;
  }

  get cartCount(): number {
    return this.cart.length;
  }

  get canAdd(): boolean {
    return Boolean(this.selected && Number(this.quantity || 0) > 0);
  }

  get canSubmit(): boolean {
    return this.cart.length > 0;
  }

  onSearch(value: string | null | undefined): void {
    this.search$.next(value ?? '');
  }

  async loadCatalog(reset = false): Promise<void> {
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
      const res = await firstValueFrom(this.materialService.catalogo({
        q: this.query,
        page: this.page,
        per_page: 20,
      }));

      const data = res.data ?? [];
      this.materiales = reset ? data : [...this.materiales, ...data];
      this.hasMore = Boolean(res.meta?.has_more);
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudo cargar materiales', 'danger');
    } finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }

  async loadMore(): Promise<void> {
    if (!this.hasMore) {
      return;
    }

    this.page += 1;
    await this.loadCatalog(false);
  }

  async doRefresh(event: any): Promise<void> {
    try {
      await this.loadCatalog(true);
    } finally {
      event?.target?.complete();
    }
  }

  openMaterial(material: ObraCivilMaterial): void {
    const existing = this.cart.find((item) => item.material.id === material.id);
    this.selected = material;
    this.quantity = existing?.quantity ?? null;
    this.itemNotes = existing?.notes ?? '';
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  async addToCart(): Promise<void> {
    if (!this.selected || Number(this.quantity || 0) <= 0) {
      await this.showToast('Captura una cantidad mayor a cero', 'warning');
      return;
    }

    if (this.selected.disponible >= 0 && Number(this.quantity) > Number(this.selected.disponible)) {
      await this.showToast('La cantidad supera el disponible. Oficina debera revisarlo.', 'warning');
    }

    const index = this.cart.findIndex((item) => item.material.id === this.selected?.id);
    const item: MaterialCartItem = {
      material: this.selected,
      quantity: Number(this.quantity),
      notes: this.itemNotes.trim(),
    };

    if (index >= 0) {
      this.cart[index] = item;
    } else {
      this.cart.push(item);
    }

    this.modalOpen = false;
    await this.showToast('Material agregado a la solicitud', 'success');
  }

  removeFromCart(materialId: number): void {
    this.cart = this.cart.filter((item) => item.material.id !== materialId);
  }

  async submitRequest(): Promise<void> {
    if (!this.canSubmit) {
      await this.showToast('Agrega al menos un material', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Enviando solicitud...',
      backdropDismiss: false,
    });

    await loading.present();

    try {
      const res = await firstValueFrom(this.materialService.store({
        notes: this.requestNotes.trim() || null,
        items: this.cart.map((item) => ({
          obra_civil_insumo_id: item.material.id,
          quantity: item.quantity,
          notes: item.notes || null,
        })),
      }));

      await this.showToast(res.message || 'Solicitud enviada', 'success');
      this.cart = [];
      this.requestNotes = '';
      await this.loadCatalog(true);
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudo enviar la solicitud', 'danger');
    } finally {
      await loading.dismiss();
    }
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






