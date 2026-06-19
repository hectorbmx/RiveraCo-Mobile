import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline,
  alertCircleOutline,
  chevronForwardOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  imageOutline,
  listOutline,
  playCircleOutline,
  trashOutline,
  timeOutline
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { AuthService, Contexto } from '../services/auth';
import { ApiService } from '../services/api';

type ActividadKey = 'metros' | 'acero' | 'bentonita' | 'concreto' | 'campana';
type VistaComisiones = 'lista' | 'nueva' | 'detalle' | 'etapa';

interface FotoLocal {
  blob: Blob;
  name: string;
  url: string;
  size: number;
}

interface PersonalRow {
  obra_empleado_id: number;
  empleado_id: number;
  nombre: string;
  rol_nombre: string | null;
  inicio: string;
  fin: string;
  comida_hrs: number;
  horas_laboradas: number;
  tiempo_extra: number;
  actividades: Record<ActividadKey, boolean>;
}

interface PerforacionRow {
  diametro: number | null;
  cantidad: number;
  profundidad: number | null;
  metros_comision: number | null;
  kg_acero: number | null;
  vol_bentonita: number | null;
  vol_concreto: number | null;
  ml_ademe_bauer: number | null;
  campana_pzas: number | null;
  adicional: number | null;
  inicio_perf: string | null;
  termino_perf: string | null;
}

interface ComisionForm {
  fecha: string;
  numero_formato: string | null;
  cliente_nombre_formato: string | null;
  observaciones: string | null;
  nombre: string | null;
  maquina_id: number | null;
  obra_maquina_id: number | null;
  obra_id: number;
  pila_id: number | null;
  personal: PersonalRow[];
  perforaciones: PerforacionRow[];
  fotos: FotoLocal[];
}

interface EtapaForm {
  hora_inicio: string | null;
  hora_fin: string | null;
  observaciones: string | null;
  produccion_valor: number | null;
  fotos: FotoLocal[];
  personal: Record<number, boolean>;
}

interface ProduccionEtapa {
  campo: string;
  detalle: string;
  label: string;
  unidad: string;
  valor: number | null;
  input?: {
    type?: string;
    step?: string;
    min?: number;
  };
}

interface ComisionResumen {
  id: number;
  fecha: string | null;
  estado: string;
  observaciones: string | null;
  pila: any | null;
  avance: {
    total: number;
    completadas: number;
    pendientes: number;
    no_aplica: number;
    porcentaje: number | null;
  };
  siguiente_etapa?: any | null;
  estatus_visual?: {
    color: string;
    label: string;
  };
  etapas: any[];
  updated_at: string | null;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToggle,
    IonToolbar
  ],
})
export class Tab3Page implements OnInit {
  ctx: Contexto | null = null;
  form: ComisionForm | null = null;
  today = '';
  vista: VistaComisiones = 'lista';
  cargandoComisiones = false;
  pendientes: ComisionResumen[] = [];
  cerradas: ComisionResumen[] = [];
  canceladas: ComisionResumen[] = [];
  resumen = { pendientes: 0, cerradas: 0, canceladas: 0, total: 0 };
  comisionSeleccionada: ComisionResumen | null = null;
  etapaSeleccionada: any | null = null;
  etapaForm: EtapaForm | null = null;
  pilasCantidadProgramada = 0;
  guardandoComision = false;
  guardandoEtapa = false;

  get maquinaNombre(): string {
    return this.ctx?.maquina?.maquina?.nombre ?? 'N/A';
  }

  get personalSinResidente() {
    return (this.form?.personal ?? []).filter(p => {
      const rol = (p?.rol_nombre ?? '').trim().toLowerCase();
      return rol !== 'residente';
    });
  }

  get pilasComisionadas(): number {
    return Math.min(this.resumen.cerradas || 0, this.pilasCantidadProgramada || 0);
  }

  get pilasFaltantes(): number {
    return Math.max((this.pilasCantidadProgramada || 0) - (this.resumen.cerradas || 0), 0);
  }

  get pilasAvancePorcentaje(): number {
    if (!this.pilasCantidadProgramada) return 0;
    return Math.min(Math.round(((this.resumen.cerradas || 0) / this.pilasCantidadProgramada) * 100), 100);
  }

  constructor(
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private auth: AuthService,
    private api: ApiService,
  ) {
    addIcons({
      chevronForwardOutline,
      addCircleOutline,
      alertCircleOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      imageOutline,
      listOutline,
      playCircleOutline,
      trashOutline,
      timeOutline,
    });
  }

  ngOnInit() {
    this.today = this.toDateInput(new Date());
    this.cargarDesdeContexto(this.auth.contextoValue);
  }

  ionViewWillEnter() {
    this.today = this.toDateInput(new Date());
    this.cargarPantalla();
  }

  async cargarPantalla() {
    try {
      const res = await firstValueFrom(this.auth.getMe());
      this.cargarDesdeContexto(res.contexto ?? this.auth.contextoValue);
      await this.cargarComisiones();
    } catch (err: any) {
      console.error('Error recargando contexto de comisiones:', err);
      this.cargarDesdeContexto(this.auth.contextoValue);
      await this.cargarComisiones();
    }
  }

  async cargarComisiones() {
    this.cargandoComisiones = true;
    try {
      const res = await firstValueFrom(this.api.getResidenteComisiones());
      const data = res?.data ?? {};
      this.resumen = data.resumen ?? this.resumen;
      this.pendientes = data.pendientes ?? [];
      this.cerradas = data.cerradas ?? [];
      this.canceladas = data.canceladas ?? [];
    } catch (err: any) {
      console.error('[COMISIONES LIST ERROR]', err);
      await this.showToast(err?.message || 'No se pudieron cargar las comisiones', 'danger');
    } finally {
      this.cargandoComisiones = false;
    }
  }

  async abrirDetalle(comision: ComisionResumen) {
    const loading = await this.loadingCtrl.create({ message: 'Cargando comision...' });
    await loading.present();

    try {
      const res = await firstValueFrom(this.api.getResidenteComision(comision.id));
      this.comisionSeleccionada = res?.data?.comision ?? comision;
      this.vista = 'detalle';
    } catch (err: any) {
      await this.showToast(err?.message || 'No se pudo abrir la comision', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  nuevaComision() {
    this.comisionSeleccionada = null;
    this.cargarDesdeContexto(this.ctx);
    this.vista = 'nueva';
  }

  volverALista() {
    this.vista = 'lista';
    this.comisionSeleccionada = null;
    this.etapaSeleccionada = null;
    this.etapaForm = null;
    this.cargarComisiones();
  }

  volverADetalle() {
    this.vista = 'detalle';
    this.etapaSeleccionada = null;
    this.etapaForm = null;
  }

  async manejarAccionEtapa(etapa: any) {
    if (!etapa?.accion) return;

    if (etapa.accion === 'activar') {
      await this.activarEtapa(etapa);
      return;
    }

    this.abrirRegistroEtapa(etapa);
  }

  abrirRegistroEtapa(etapa: any) {
    if (!etapa || etapa.estado === 'completada') return;

    const personalPrevio = new Set<number>(
      (etapa.personal ?? [])
        .map((p: any) => Number(p.obra_empleado_id))
        .filter((id: number) => !!id)
    );
    const tienePersonalPrevio = personalPrevio.size > 0;
    const personal: Record<number, boolean> = {};

    this.personalSinResidente.forEach((p) => {
      personal[p.obra_empleado_id] = tienePersonalPrevio
        ? personalPrevio.has(Number(p.obra_empleado_id))
        : true;
    });

    this.etapaSeleccionada = etapa;
    this.etapaForm = {
      hora_inicio: etapa.hora_inicio || this.horaActual(),
      hora_fin: etapa.hora_fin || null,
      observaciones: etapa.observaciones || null,
      produccion_valor: etapa.produccion ? Number(etapa.produccion.valor ?? 0) : null,
      fotos: [],
      personal,
    };
    this.vista = 'etapa';
  }

  async activarEtapa(etapa: any) {
    if (!this.comisionSeleccionada?.id || !etapa?.etapa) return;

    const loading = await this.loadingCtrl.create({ message: `Activando ${this.etapaNombre(etapa.etapa)}...` });
    await loading.present();

    try {
      const res = await firstValueFrom(
        this.api.patchResidenteComisionEtapa(this.comisionSeleccionada.id, etapa.etapa, {
          estado: 'pendiente',
          requiere_foto: true,
        })
      );
      this.comisionSeleccionada = res?.data?.comision ?? this.comisionSeleccionada;
      await this.showToast(`${this.etapaNombre(etapa.etapa)} activada`, 'success');
    } catch (err: any) {
      console.error('[COMISION ETAPA ACTIVATE ERROR]', err);
      await this.showToast(err?.message || 'No se pudo activar la etapa', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async deshabilitarEtapa(etapa: any) {
    if (!this.comisionSeleccionada?.id || !etapa?.etapa || !this.puedeDeshabilitarEtapa(etapa)) return;

    const alert = await this.alertCtrl.create({
      header: 'Deshabilitar etapa',
      message: `${this.etapaNombre(etapa.etapa)} volvera a quedar como no aplica.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Deshabilitar',
          role: 'destructive',
          handler: () => true,
        },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss();
    if (result.role !== 'destructive') return;

    const loading = await this.loadingCtrl.create({ message: `Deshabilitando ${this.etapaNombre(etapa.etapa)}...` });
    await loading.present();

    try {
      const res = await firstValueFrom(
        this.api.patchResidenteComisionEtapa(this.comisionSeleccionada.id, etapa.etapa, {
          estado: 'no_aplica',
          requiere_foto: false,
        })
      );
      this.comisionSeleccionada = res?.data?.comision ?? this.comisionSeleccionada;
      await this.cargarComisiones();
      await this.showToast(`${this.etapaNombre(etapa.etapa)} deshabilitada`, 'success');
    } catch (err: any) {
      console.error('[COMISION ETAPA DISABLE ERROR]', err);
      await this.showToast(err?.message || 'No se pudo deshabilitar la etapa', 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  private cargarDesdeContexto(contexto: Contexto | null) {
    this.ctx = contexto ?? null;

    if (!this.ctx) {
      this.form = null;
      this.pilasCantidadProgramada = 0;
      return;
    }

    const pilas = this.ctx.pilas ?? [];
    this.pilasCantidadProgramada = pilas.reduce((acc, p: any) => acc + Number(p.cantidad_programada ?? 0), 0);

    this.form = {
      fecha: this.today,
      numero_formato: null,
      cliente_nombre_formato: this.ctx.obra?.cliente_nombre ?? null,
      observaciones: null,
      nombre: this.ctx.obra?.nombre ?? null,
      maquina_id: this.ctx.maquina?.maquina_id ?? null,
      obra_maquina_id: this.ctx.maquina?.obra_maquina_id ?? null,
      obra_id: this.ctx.obra.id,
      pila_id: null,
      personal: (this.ctx.empleados ?? []).map((e) => ({
        obra_empleado_id: e.obra_empleado_id,
        empleado_id: e.empleado_id,
        nombre: e.empleado?.nombre ?? 'N/A',
        rol_nombre: e.rol?.nombre ?? null,
        inicio: '08:00',
        fin: '17:00',
        comida_hrs: 1,
        horas_laboradas: 8,
        tiempo_extra: 0,
        actividades: {
          metros: true,
          acero: false,
          bentonita: false,
          concreto: false,
          campana: false,
        },
      })),
      perforaciones: [this.newPerforacionRow()],
      fotos: [],
    };

    const first = this.ctx.pilas?.[0];
    if (first && !this.form.pila_id) {
      this.form.pila_id = Number(first.id);
      this.onPilaChange(this.form.pila_id);
    }
  }

  onPilaChange(pilaId: number | string | null) {
    if (!this.ctx || !this.form) return;

    const id = pilaId != null ? Number(pilaId) : null;
    if (!id) return;

    const pila = (this.ctx.pilas ?? []).find(p => Number(p.id) === id);
    if (!pila) return;

    const row = this.form.perforaciones[0] ?? this.newPerforacionRow();
    row.diametro = pila.diametro != null ? Number(pila.diametro) : null;
    row.cantidad = 1;
    row.profundidad = pila.profundidad != null ? Number(pila.profundidad) : null;
    row.metros_comision = row.profundidad;

    if (!this.form.perforaciones[0]) {
      this.form.perforaciones = [row];
    }
  }

  newPerforacionRow(): PerforacionRow {
    return {
      diametro: null,
      cantidad: 1,
      profundidad: null,
      metros_comision: null,
      kg_acero: null,
      vol_bentonita: null,
      vol_concreto: null,
      ml_ademe_bauer: 0,
      campana_pzas: 0,
      adicional: null,
      inicio_perf: null,
      termino_perf: null,
    };
  }

  removePerforacionRow(i: number) {
    if (!this.form) return;
    if (this.form.perforaciones.length <= 1) return;
    this.form.perforaciones.splice(i, 1);
  }

  async tomarFotoNuevaComision() {
    if (!this.form) return;
    const foto = await this.capturarFotoLocal('perforacion');
    if (foto) {
      this.form.fotos.push(foto);
    }
  }

  quitarFotoNuevaComision(index: number) {
    if (!this.form?.fotos[index]) return;
    URL.revokeObjectURL(this.form.fotos[index].url);
    this.form.fotos.splice(index, 1);
  }

  async tomarFotoEtapa() {
    if (!this.etapaForm || !this.etapaSeleccionada) return;
    const foto = await this.capturarFotoLocal(this.etapaSeleccionada.etapa);
    if (foto) {
      this.etapaForm.fotos.push(foto);
    }
  }

  quitarFotoEtapa(index: number) {
    if (!this.etapaForm?.fotos[index]) return;
    URL.revokeObjectURL(this.etapaForm.fotos[index].url);
    this.etapaForm.fotos.splice(index, 1);
  }

  private async capturarFotoLocal(etapa: string): Promise<FotoLocal | null> {
    try {
      const photo = await Camera.getPhoto({
        quality: 75,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (!photo.webPath) return null;

      const original = await fetch(photo.webPath).then(r => r.blob());
      const blob = await this.comprimirImagen(original);
      const name = `${etapa}_${Date.now()}.webp`;

      return {
        blob,
        name,
        url: URL.createObjectURL(blob),
        size: blob.size,
      };
    } catch (err) {
      console.error('[COMISION FOTO ERROR]', err);
      return null;
    }
  }

  private async comprimirImagen(blob: Blob): Promise<Blob> {
    const image = await this.blobToImage(blob);
    const maxSide = 1280;
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.round(image.width * ratio);
    const height = Math.round(image.height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return blob;

    ctx.drawImage(image, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (compressed) => resolve(compressed ?? blob),
        'image/webp',
        0.72
      );
    });
  }

  private blobToImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      image.src = url;
    });
  }

  async guardarComision() {
    if (!this.form) return;
    if (this.guardandoComision) return;

    const perforacion = this.form.perforaciones[0];
    if (!this.form.pila_id) {
      await this.showToast('Selecciona una pila', 'danger');
      return;
    }
    if (!perforacion?.inicio_perf) {
      await this.showToast('Captura inicio de perforacion', 'danger');
      return;
    }

    this.guardandoComision = true;
    const loading = await this.loadingCtrl.create({ message: 'Guardando comision...' });
    await loading.present();

    try {
      const personal = this.personalSinResidente
        .filter(p => p.actividades.metros)
        .map(p => ({
          obra_empleado_id: p.obra_empleado_id,
          comisiona: true,
          importe_comision: 0,
        }));

      const payload = {
        fecha: this.form.fecha,
        pila_id: this.form.pila_id,
        numero_formato: this.form.numero_formato,
        cliente_nombre: this.form.cliente_nombre_formato,
        observaciones: this.form.observaciones,
        opcionales: {
          bentonita: Number(perforacion.vol_bentonita ?? 0) > 0,
          ademe: Number(perforacion.ml_ademe_bauer ?? 0) > 0,
        },
        perforacion: {
          hora_inicio: perforacion.inicio_perf,
          hora_fin: perforacion.termino_perf,
          observaciones: this.form.observaciones,
          diametro: perforacion.diametro,
          cantidad: perforacion.cantidad,
          profundidad: perforacion.profundidad,
          metros_comision: perforacion.metros_comision,
          kg_acero: perforacion.kg_acero,
          vol_bentonita: perforacion.vol_bentonita,
          vol_concreto: perforacion.vol_concreto,
          ml_ademe_bauer: perforacion.ml_ademe_bauer,
          campana_pzas: perforacion.campana_pzas,
          adicional: perforacion.adicional,
          personal,
        },
      };

      const res = await firstValueFrom(this.api.postResidenteComision(payload));
      this.comisionSeleccionada = res?.data?.comision ?? null;
      if (this.comisionSeleccionada?.id && this.form.fotos.length) {
        await this.subirFotosEtapa(this.comisionSeleccionada.id, 'perforacion', this.form.fotos);
        await this.refrescarDetalle(this.comisionSeleccionada.id);
      }
      await this.showToast('Comision creada correctamente', 'success');
      await this.cargarComisiones();
      this.vista = this.comisionSeleccionada ? 'detalle' : 'lista';
    } catch (err: any) {
      console.error('[COMISION CREATE ERROR]', err);
      await this.showToast(err?.message || 'Error al guardar la comision', 'danger');
    } finally {
      this.guardandoComision = false;
      await loading.dismiss();
    }
  }

  async guardarEtapa() {
    if (!this.comisionSeleccionada?.id || !this.etapaSeleccionada || !this.etapaForm) return;
    if (this.guardandoEtapa) return;

    if (!this.etapaForm.hora_inicio) {
      await this.showToast('Captura hora de inicio', 'danger');
      return;
    }

    if (!this.etapaForm.hora_fin) {
      await this.showToast('Captura hora de fin para completar la etapa', 'danger');
      return;
    }

    this.guardandoEtapa = true;
    const comisionId = this.comisionSeleccionada.id;
    const etapaKey = this.etapaSeleccionada.etapa;
    const loading = await this.loadingCtrl.create({ message: `Guardando ${this.etapaNombre(etapaKey)}...` });
    await loading.present();

    try {
      const personal = this.personalSinResidente
        .filter(p => this.etapaForm?.personal[p.obra_empleado_id])
        .map(p => ({
          obra_empleado_id: p.obra_empleado_id,
          comisiona: true,
          importe_comision: 0,
        }));

      const payload: any = {
        estado: 'completada',
        hora_inicio: this.etapaForm.hora_inicio,
        hora_fin: this.etapaForm.hora_fin,
        observaciones: this.etapaForm.observaciones,
        requiere_foto: true,
        personal,
      };

      const produccion = this.produccionSeleccionada();
      if (produccion?.campo) {
        payload[produccion.campo] = Number(this.etapaForm.produccion_valor || 0);
      }

      const res = await firstValueFrom(
        this.api.patchResidenteComisionEtapa(comisionId, etapaKey, payload)
      );

      this.comisionSeleccionada = res?.data?.comision ?? this.comisionSeleccionada;

      if (this.etapaForm.fotos.length) {
        await this.subirFotosEtapa(comisionId, etapaKey, this.etapaForm.fotos);
        await this.refrescarDetalle(comisionId);
      }

      await this.showToast(`${this.etapaNombre(etapaKey)} guardada`, 'success');
      await this.cargarComisiones();
      this.volverADetalle();
    } catch (err: any) {
      console.error('[COMISION ETAPA SAVE ERROR]', err);
      await this.showToast(err?.message || 'No se pudo guardar la etapa', 'danger');
    } finally {
      this.guardandoEtapa = false;
      await loading.dismiss();
    }
  }

  private async subirFotosEtapa(comisionId: number, etapa: string, fotos: FotoLocal[]) {
    for (const foto of fotos) {
      const formData = new FormData();
      formData.append('foto', foto.blob, foto.name);
      await firstValueFrom(this.api.postResidenteComisionEtapaFoto(comisionId, etapa, formData));
    }
  }

  private async refrescarDetalle(comisionId: number) {
    const res = await firstValueFrom(this.api.getResidenteComision(comisionId));
    this.comisionSeleccionada = res?.data?.comision ?? this.comisionSeleccionada;
  }

  etiquetaEstado(estado: string | null | undefined): string {
    const value = estado ?? '';
    return value.replace(/_/g, ' ').toUpperCase();
  }

  claseEstado(estado: string | null | undefined): string {
    return `estado-${estado || 'pendiente'}`;
  }

  etapaNombre(etapa: string): string {
    const labels: Record<string, string> = {
      perforacion: 'Perforacion',
      bentonita: 'Bentonita',
      ademe: 'Ademe',
      acero: 'Colocacion de acero',
      colado: 'Colado',
    };
    return labels[etapa] ?? etapa;
  }

  produccionSeleccionada(): ProduccionEtapa | null {
    return (this.etapaSeleccionada?.produccion ?? null) as ProduccionEtapa | null;
  }

  etiquetaAccionEtapa(etapa: any): string {
    const accion = etapa?.accion;
    if (accion === 'activar') return 'Activar';
    if (accion === 'continuar') return 'Continuar';
    if (accion === 'registrar') return 'Registrar';
    return '';
  }

  puedeDeshabilitarEtapa(etapa: any): boolean {
    const estado = etapa?.estado ?? '';
    return this.esEtapaOpcional(etapa)
      && estado !== 'completada'
      && estado !== 'no_aplica';
  }

  private esEtapaOpcional(etapa: any): boolean {
    if (etapa?.es_opcional !== undefined) {
      return !!etapa.es_opcional;
    }

    return ['bentonita', 'ademe'].includes(etapa?.etapa ?? '');
  }

  claseComision(c: ComisionResumen): string {
    const color = c.estatus_visual?.color || '';
    return color ? `visual-${color}` : '';
  }

  siguienteEtapaVisible(comision: ComisionResumen | null): any | null {
    if (!comision || (comision.avance?.porcentaje ?? 0) >= 100) {
      return null;
    }

    const siguiente = comision.siguiente_etapa;
    if (!siguiente || siguiente.estado === 'no_aplica' || siguiente.accion === 'activar') {
      return null;
    }

    return siguiente;
  }

  formatoKb(size: number): string {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  private toDateInput(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private horaActual(): string {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
