import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, refreshOutline, receiptOutline, searchOutline, trashOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import {
  ReposicionCfdi,
  ReposicionConcepto,
  ReposicionGasto,
  ReposicionGastosService,
  ReposicionPartida,
  TipoReposicion
} from '../services/reposicion-gastos';

interface ReposicionForm {
  tipo_reposicion: TipoReposicion | null;
  partida_id: number | null;
  semana: string;
  observaciones: string | null;
}

interface CfdiFilters {
  rfc_emisor: string;
  fecha: string;
  monto: number | null;
  uuid4: string;
}

interface ManualConcepto {
  descripcion: string;
  proveedor: string;
  fecha: string;
  monto: number | null;
}

@Component({
  selector: 'app-tab-reposicion-gastos',
  templateUrl: './tab-reposicion-gastos.page.html',
  styleUrls: ['./tab-reposicion-gastos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class TabReposicionGastosPage implements OnInit {
  loading = false;
  searching = false;
  showForm = false;
  showKpis = false;

  obraNombre = '';
  reposiciones: ReposicionGasto[] = [];
  partidas: ReposicionPartida[] = [];
  groupedPartidas: Array<{ partida: string; opciones: ReposicionPartida[] }> = [];
  cfdis: ReposicionCfdi[] = [];
  conceptos: ReposicionConcepto[] = [];

  stats = {
    total: 0,
    solicitadas: 0,
    en_revision: 0,
    autorizadas: 0,
  };

  montos = {
    solicitado: 0,
    autorizado: 0,
    pagado: 0,
  };

  form: ReposicionForm = this.defaultForm();
  filters: CfdiFilters = this.defaultFilters();
  manual: ManualConcepto = this.defaultManual();

  constructor(
    private reposicionGastos: ReposicionGastosService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ addCircleOutline, refreshOutline, receiptOutline, searchOutline, trashOutline });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ionViewWillEnter(): void {
    this.loadData();
  }

  get totalConceptos(): number {
    return this.conceptos.reduce((total, concepto) => total + Number(concepto.monto || 0), 0);
  }

  get canSubmit(): boolean {
    return Boolean(this.form.tipo_reposicion && this.form.partida_id && this.form.semana && this.conceptos.length > 0);
  }

  async loadData(): Promise<void> {
    this.loading = true;

    try {
      const [index, catalogo] = await Promise.all([
        firstValueFrom(this.reposicionGastos.index()),
        firstValueFrom(this.reposicionGastos.catalogo()),
      ]);

      this.obraNombre = index.obra?.nombre ?? 'Obra';
      this.stats = index.stats;
      this.montos = index.montos;
      this.reposiciones = index.data ?? [];
      this.partidas = catalogo.data ?? [];
      this.groupedPartidas = this.buildGroupedPartidas(this.partidas);

      this.ensureSelectedPartida();
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudo cargar reposicion de gastos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;

    if (this.showForm && !this.form.semana) {
      this.form.semana = this.currentWeek();
    }
  }

  onTipoChange(): void {
    this.cfdis = [];
    this.conceptos = [];
    this.manual = this.defaultManual();
    this.ensureSelectedPartida();
  }

  async buscarCfdis(): Promise<void> {
    this.searching = true;

    try {
      const res = await firstValueFrom(this.reposicionGastos.buscarCfdis(this.filters));
      this.cfdis = res.data ?? [];

      if (this.cfdis.length === 0) {
        await this.showToast('Sin CFDI encontrados', 'medium');
      }
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudo buscar CFDI', 'danger');
    } finally {
      this.searching = false;
    }
  }

  addCfdi(cfdi: ReposicionCfdi): void {
    if (cfdi.uuid && this.conceptos.some((concepto) => concepto.uuid === cfdi.uuid)) {
      this.showToast('Ese CFDI ya esta agregado', 'warning');
      return;
    }

    this.conceptos.push({
      sat_cfdi_id: cfdi.id,
      partida_id: this.form.partida_id,
      tipo: 'Caja chica',
      descripcion: 'CFDI SAT',
      proveedor: cfdi.emisor_nombre,
      rfc: cfdi.rfc_emisor,
      uuid: cfdi.uuid,
      fecha: cfdi.fecha,
      monto: Number(cfdi.total || 0),
    });
  }

  async addManual(): Promise<void> {
    const monto = Number(this.manual.monto || 0);

    if (monto <= 0) {
      await this.showToast('Captura un monto valido', 'warning');
      return;
    }

    this.conceptos.push({
      partida_id: this.form.partida_id,
      tipo: this.form.tipo_reposicion === 'viaticos' ? 'Viaticos' : 'Gastos varios',
      descripcion: this.manual.descripcion || null,
      proveedor: this.manual.proveedor || null,
      fecha: this.manual.fecha || null,
      monto,
      rfc: null,
      uuid: null,
      sat_cfdi_id: null,
    });

    this.manual = this.defaultManual();
  }

  removeConcepto(index: number): void {
    this.conceptos.splice(index, 1);
  }

  async guardar(): Promise<void> {
    if (!this.form.tipo_reposicion) {
      await this.showToast('Selecciona el tipo de reposicion', 'warning');
      return;
    }

    if (!this.canSubmit || !this.form.partida_id) {
      await this.showToast('Completa partida, semana y conceptos', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando reposicion...',
    });
    await loading.present();

    try {
      await firstValueFrom(this.reposicionGastos.store({
        tipo_reposicion: this.form.tipo_reposicion,
        partida_id: this.form.partida_id,
        semana: this.form.semana,
        observaciones: this.form.observaciones,
        conceptos: this.conceptos,
      }));

      await this.showToast('Reposicion registrada correctamente', 'success');
      this.resetForm();
      this.showForm = false;
      await this.loadData();
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudo guardar la reposicion', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  formatMoney(value: number | null | undefined): string {
    return Number(value || 0).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });
  }

  partidaLabel(partida: ReposicionPartida | null): string {
    if (!partida) {
      return 'Sin partida';
    }

    return [partida.partida, partida.concepto].filter(Boolean).join(' - ') || `Partida ${partida.id}`;
  }

  conceptoLabel(partida: ReposicionPartida): string {
    return partida.concepto || partida.partida || `Partida ${partida.id}`;
  }

  estatusColor(estatus: string): string {
    if (['autorizado', 'pagado', 'cerrado'].includes(estatus)) {
      return 'success';
    }

    if (['rechazado'].includes(estatus)) {
      return 'danger';
    }

    if (estatus === 'solicitado') {
      return 'warning';
    }

    return 'primary';
  }

  private resetForm(): void {
    this.form = this.defaultForm();
    this.filters = this.defaultFilters();
    this.manual = this.defaultManual();
    this.cfdis = [];
    this.conceptos = [];
  }

  private defaultForm(partidaId: number | null = null): ReposicionForm {
    return {
      tipo_reposicion: null,
      partida_id: partidaId,
      semana: this.currentWeek(),
      observaciones: null,
    };
  }

  private ensureSelectedPartida(): void {
    if (this.form.tipo_reposicion && !this.form.partida_id && this.partidas.length > 0) {
      this.form.partida_id = this.partidas[0].id;
    }
  }

  private buildGroupedPartidas(partidas: ReposicionPartida[]): Array<{ partida: string; opciones: ReposicionPartida[] }> {
    const grupos = new Map<string, ReposicionPartida[]>();

    partidas.forEach((partida) => {
      const key = (partida.partida || 'SIN PARTIDA').trim();
      const actuales = grupos.get(key) ?? [];
      actuales.push(partida);
      grupos.set(key, actuales);
    });

    return Array.from(grupos.entries()).map(([partida, opciones]) => ({ partida, opciones }));
  }

  private defaultFilters(): CfdiFilters {
    return {
      rfc_emisor: '',
      fecha: '',
      monto: null,
      uuid4: '',
    };
  }

  private defaultManual(): ManualConcepto {
    return {
      descripcion: '',
      proveedor: '',
      fecha: '',
      monto: null,
    };
  }

  private currentWeek(): string {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), 0, 1);
    const pastDays = Math.floor((now.getTime() - firstDay.getTime()) / 86400000);
    const week = Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
