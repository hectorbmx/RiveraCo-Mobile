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
import { addCircleOutline, chevronDownOutline, documentTextOutline, refreshOutline, searchOutline, sendOutline, trashOutline } from 'ionicons/icons';
import { Subject, Subscription, debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { CompanyLoadingOverlayComponent } from '../shared/company-loading-overlay/company-loading-overlay.component';
import { AuthService, Contexto } from '../services/auth';
import { ObraCivilCommercialMaterial, ObraCivilMaterial, ObraCivilMaterialService } from '../services/obra-civil-material';

interface CommercialLineItem {
  material: ObraCivilCommercialMaterial;
  quantity: number;
  kg: number;
}

interface MaterialCartItem {
  material: ObraCivilMaterial;
  quantity: number;
  commercialItems: CommercialLineItem[];
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
  selectedCommercialMaterialId: number | null = null;
  commercialQuantity: number | null = null;
  modalOpen = false;
  quantity: number | null = null;
  itemNotes = '';
  requestNotes = '';
  commercialLines: CommercialLineItem[] = [];
  cart: MaterialCartItem[] = [];
  commercialPickerOpen = false;

  private contextoSub?: Subscription;
  private searchSub?: Subscription;
  private search$ = new Subject<string>();

  constructor(
    private authService: AuthService,
    private materialService: ObraCivilMaterialService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ addCircleOutline, chevronDownOutline, documentTextOutline, refreshOutline, searchOutline, sendOutline, trashOutline });
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

  get pendingCommercialMaterial(): ObraCivilCommercialMaterial | null {
    if (!this.selected || !this.selectedCommercialMaterialId) {
      return null;
    }

    return this.selected.commercial_products.find((material) => material.id === this.selectedCommercialMaterialId) ?? null;
  }

  get selectedUsesCommercialMaterial(): boolean {
    return Boolean(this.selected?.has_commercial_products && this.selected.commercial_products_count > 0);
  }

  get pendingKg(): number {
    if (!this.pendingCommercialMaterial || Number(this.commercialQuantity || 0) <= 0) {
      return 0;
    }

    return this.commercialQuantityToKg(this.pendingCommercialMaterial, Number(this.commercialQuantity));
  }

  get totalCommercialPieces(): number {
    return Number(this.commercialLines.reduce((total, item) => total + item.quantity, 0).toFixed(4));
  }

  get totalCommercialKg(): number {
    return Number(this.commercialLines.reduce((total, item) => total + item.kg, 0).toFixed(4));
  }

  get convertedQuantity(): number {
    if (!this.selectedUsesCommercialMaterial || !this.selected) {
      return 0;
    }

    return this.kgToBudgetUnit(this.totalCommercialKg, this.selected.unidad);
  }

  get canAddCommercialLine(): boolean {
    return Boolean(this.selectedUsesCommercialMaterial && this.pendingCommercialMaterial && Number(this.commercialQuantity || 0) > 0);
  }

  get canAdd(): boolean {
    if (!this.selected) {
      return false;
    }

    return this.selectedUsesCommercialMaterial ? this.commercialLines.length > 0 : Number(this.quantity || 0) > 0;
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
    this.selectedCommercialMaterialId = material.commercial_products?.[0]?.id ?? null;
    this.commercialQuantity = null;
    this.quantity = existing && existing.commercialItems.length === 0 ? existing.quantity : null;
    this.commercialLines = existing ? existing.commercialItems.map((item) => ({ ...item })) : [];
    this.itemNotes = existing?.notes ?? '';
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.commercialPickerOpen = false;
  }

  openCommercialPicker(): void {
    if (!this.selectedUsesCommercialMaterial) {
      return;
    }

    this.commercialPickerOpen = true;
  }

  closeCommercialPicker(): void {
    this.commercialPickerOpen = false;
  }

  selectCommercialMaterial(material: ObraCivilCommercialMaterial): void {
    this.selectedCommercialMaterialId = material.id;
    this.commercialPickerOpen = false;
  }

  async addCommercialLine(): Promise<void> {
    const material = this.pendingCommercialMaterial;
    const quantity = Number(this.commercialQuantity || 0);

    if (!material || quantity <= 0) {
      await this.showToast('Selecciona una pieza y captura una cantidad mayor a cero', 'warning');
      return;
    }

    const kg = this.commercialQuantityToKg(material, quantity);
    const index = this.commercialLines.findIndex((item) => item.material.id === material.id);

    if (index >= 0) {
      const nextQuantity = Number((this.commercialLines[index].quantity + quantity).toFixed(4));
      this.commercialLines[index] = {
        material,
        quantity: nextQuantity,
        kg: this.commercialQuantityToKg(material, nextQuantity),
      };
    } else {
      this.commercialLines.push({ material, quantity, kg });
    }

    this.commercialQuantity = null;
  }

  removeCommercialLine(materialId: number): void {
    this.commercialLines = this.commercialLines.filter((item) => item.material.id !== materialId);
  }

  async addToCart(): Promise<void> {
    if (!this.selected) {
      return;
    }

    if (this.selectedUsesCommercialMaterial && this.commercialLines.length === 0) {
      await this.showToast('Agrega al menos una pieza comercial', 'warning');
      return;
    }

    if (!this.selectedUsesCommercialMaterial && Number(this.quantity || 0) <= 0) {
      await this.showToast('Captura una cantidad mayor a cero', 'warning');
      return;
    }

    const budgetQuantity = this.selectedUsesCommercialMaterial
      ? this.convertedQuantity
      : Number(this.quantity);

    if (this.selected.disponible >= 0 && budgetQuantity > Number(this.selected.disponible)) {
      await this.showToast('La cantidad supera el disponible. Oficina debera revisarlo.', 'warning');
    }

    const index = this.cart.findIndex((item) => item.material.id === this.selected?.id);
    const item: MaterialCartItem = {
      material: this.selected,
      quantity: budgetQuantity,
      commercialItems: this.selectedUsesCommercialMaterial ? this.commercialLines.map((line) => ({ ...line })) : [],
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
          commercial_items: item.commercialItems.length > 0
            ? item.commercialItems.map((commercialItem) => ({
                commercial_material_id: commercialItem.material.id,
                commercial_quantity: commercialItem.quantity,
              }))
            : undefined,
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

  commercialMaterialLabel(material: ObraCivilCommercialMaterial): string {
    const sku = material.sku ? `${material.sku} · ` : '';
    const weight = material.peso_por_pieza ? ` · ${Number(material.peso_por_pieza).toFixed(3)} kg/pza` : '';

    return `${sku}${material.descripcion}${weight}`;
  }

  private commercialQuantityToKg(material: ObraCivilCommercialMaterial, quantity: number): number {
    const factor = Number(material.peso_por_pieza || material.factor_conversion || 0);

    return Number((quantity * factor).toFixed(4));
  }

  private kgToBudgetUnit(kg: number, unit: string | null): number {
    const normalizedUnit = (unit || '').trim().toUpperCase();
    const value = ['TON', 'T', 'TONS', 'TONELADA', 'TONELADAS'].includes(normalizedUnit) ? kg / 1000 : kg;

    return Number(value.toFixed(4));
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



