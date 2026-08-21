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
import { addCircleOutline, barChartOutline, cameraOutline, closeCircleOutline, refreshOutline, searchOutline } from 'ionicons/icons';
import { Subject, Subscription, debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { CompanyLoadingOverlayComponent } from '../shared/company-loading-overlay/company-loading-overlay.component';
import { AuthService, Contexto } from '../services/auth';
import { ObraCivilAvanceConcepto, ObraCivilAvanceService } from '../services/obra-civil-avance';

interface SelectedPhoto {
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
}

@Component({
  selector: 'app-tab-avance-civil',
  templateUrl: './tab-avance-civil.page.html',
  styleUrls: ['./tab-avance-civil.page.scss'],
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
export class TabAvanceCivilPage implements OnInit, OnDestroy {
  contexto: Contexto | null = null;
  loading = false;
  loadingMore = false;
  compressingPhotos = false;
  query = '';
  page = 1;
  hasMore = false;
  conceptos: ObraCivilAvanceConcepto[] = [];
  selected: ObraCivilAvanceConcepto | null = null;
  captureOpen = false;
  quantity: number | null = null;
  notes = '';
  itemNotes = '';
  photos: SelectedPhoto[] = [];

  private contextoSub?: Subscription;
  private searchSub?: Subscription;
  private search$ = new Subject<string>();

  constructor(
    private authService: AuthService,
    private avanceService: ObraCivilAvanceService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ addCircleOutline, barChartOutline, cameraOutline, closeCircleOutline, refreshOutline, searchOutline });
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
    this.clearPhotoPreviews();
  }

  get obra() {
    return this.contexto?.obra ?? null;
  }

  get canSubmit(): boolean {
    return Boolean(this.selected && Number(this.quantity || 0) > 0 && !this.compressingPhotos);
  }

  get totalOriginalPhotoSize(): number {
    return this.photos.reduce((sum, photo) => sum + photo.originalSize, 0);
  }

  get totalCompressedPhotoSize(): number {
    return this.photos.reduce((sum, photo) => sum + photo.compressedSize, 0);
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
      const res = await firstValueFrom(this.avanceService.catalogo({
        q: this.query,
        page: this.page,
        per_page: 20,
      }));

      const data = res.data ?? [];
      this.conceptos = reset ? data : [...this.conceptos, ...data];
      this.hasMore = Boolean(res.meta?.has_more);
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudo cargar el catalogo de avance', 'danger');
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

  openCapture(concepto: ObraCivilAvanceConcepto): void {
    this.selected = concepto;
    this.quantity = null;
    this.notes = '';
    this.itemNotes = '';
    this.clearPhotoPreviews();
    this.photos = [];
    this.captureOpen = true;
  }

  closeCapture(): void {
    this.captureOpen = false;
    this.clearPhotoPreviews();
    this.photos = [];
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    this.clearPhotoPreviews();
    this.photos = [];

    if (files.length === 0) {
      return;
    }

    this.compressingPhotos = true;

    try {
      const compressed = await Promise.all(files.map((file) => this.preparePhoto(file)));
      this.photos = compressed;
    } catch (error) {
      await this.showToast('No se pudieron preparar una o mas fotos', 'danger');
    } finally {
      this.compressingPhotos = false;
      input.value = '';
    }
  }

  removePhoto(index: number): void {
    const [photo] = this.photos.splice(index, 1);

    if (photo?.previewUrl) {
      URL.revokeObjectURL(photo.previewUrl);
    }

    this.photos = [...this.photos];
  }

  formatBytes(bytes: number): string {
    if (!bytes) {
      return '0 KB';
    }

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(0)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
  }

  async submit(): Promise<void> {
    if (!this.selected || Number(this.quantity || 0) <= 0) {
      await this.showToast('Captura una cantidad mayor a cero', 'warning');
      return;
    }

    if (this.selected.disponible >= 0 && Number(this.quantity) > Number(this.selected.disponible)) {
      await this.showToast('La cantidad supera el disponible. Oficina debera revisarlo.', 'warning');
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando avance...',
      backdropDismiss: false,
    });

    await loading.present();

    try {
      const formData = new FormData();
      formData.append('civil_concept_id', String(this.selected.id));
      formData.append('quantity', String(this.quantity));

      if (this.notes.trim()) {
        formData.append('notes', this.notes.trim());
      }

      if (this.itemNotes.trim()) {
        formData.append('item_notes', this.itemNotes.trim());
      }

      this.photos.forEach((photo) => formData.append('photos[]', photo.file));

      const res = await firstValueFrom(this.avanceService.store(formData));
      await this.showToast(res.message || 'Avance registrado', 'success');
      this.captureOpen = false;
      this.clearPhotoPreviews();
      this.photos = [];
      await this.loadCatalog(true);
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudo guardar el avance', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private async preparePhoto(file: File): Promise<SelectedPhoto> {
    const compressedFile = await this.compressImage(file);

    return {
      file: compressedFile,
      previewUrl: URL.createObjectURL(compressedFile),
      originalSize: file.size,
      compressedSize: compressedFile.size,
    };
  }

  private async compressImage(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file);
    const maxDimension = 1280;
    const ratio = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.68);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const filename = file.name.replace(/\.[^.]+$/, '') || 'avance';

    return new File([blob], `${filename}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  }

  private clearPhotoPreviews(): void {
    this.photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
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





