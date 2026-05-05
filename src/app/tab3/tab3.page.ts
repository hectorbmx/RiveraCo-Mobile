import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
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
import { addCircleOutline, alertCircleOutline, chevronForwardOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { AuthService, Contexto } from '../services/auth'; // donde tengas tus interfaces

import { ApiService } from '../services/api';


type ActividadKey = 'metros' | 'acero' | 'bentonita' | 'concreto' | 'campana';

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
  total_pilas?: number;
  personal: PersonalRow[];
  perforaciones: PerforacionRow[];
}


@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonBackButton, IonIcon, 
    CommonModule,IonButtons,IonSelect,IonSelectOption,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButton, IonInput, IonTextarea,FormsModule,
     IonToggle
  ],
})
export class Tab3Page implements OnInit {
  pilasCantidadProgramada  = 0;
  ctx: Contexto | null = null;
  selectedPilaId: number | null = null;
  form: ComisionForm | null = null;

  // UI helpers
  get maquinaNombre(): string {
    return this.ctx?.maquina?.maquina?.nombre ?? 'N/A';
  }

  constructor(
      private loadingCtrl: LoadingController,
      private toastCtrl: ToastController,
      private auth: AuthService,
      private api: ApiService,) {
     addIcons({chevronForwardOutline,addCircleOutline,alertCircleOutline});
  }
today = '';

private toDateInput(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
ionViewWillEnter() {
  this.today = this.toDateInput(new Date());
}
  ngOnInit() {
    this.ctx = this.auth.contextoValue ?? null;

    if (!this.ctx) return;
     const pilas = this.ctx.pilas ?? [];
      this.pilasCantidadProgramada = pilas.reduce((acc, p: any) => {
      const n = Number(p.cantidad_programada ?? 0);
      return acc + (isNaN(n) ? 0 : n);
    }, 0);
     console.log('Pilas:', this.ctx.pilas);

    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');


    this.form = {
      fecha: `${yyyy}-${mm}-${dd}`,
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
      

      perforaciones: [
        this.newPerforacionRow(),
      ],
    };
    const first = this.ctx.pilas?.[0];
      if (first && !this.form.pila_id) {
        this.form.pila_id = Number(first.id);
        this.onPilaChange(this.form.pila_id);
      }
  }
  get personalSinResidente() {
    return (this.form?.personal ?? []).filter(p => {
      const rol = (p?.rol_nombre ?? '').trim().toLowerCase();
      return rol !== 'residente';
    });
  }

onPilaChange(pilaId: number | string | null) {
  if (!this.ctx || !this.form) return;

  const id = pilaId != null ? Number(pilaId) : null;
  if (!id) return;

  const pila = (this.ctx.pilas ?? []).find(p => Number(p.id) === id);
  if (!pila) return;

  // Tomamos la primera fila (MVP)
  const row = this.form.perforaciones[0] ?? this.newPerforacionRow();

  const diametro = pila.diametro != null ? Number(pila.diametro) : null;
  const profundidad = pila.profundidad != null ? Number(pila.profundidad) : null;

  row.diametro = Number.isFinite(diametro as any) ? diametro : null;
  row.cantidad = 1;
  row.profundidad = Number.isFinite(profundidad as any) ? profundidad : null;
  row.metros_comision = row.profundidad; // regla simple por ahora

  // Si no existía fila, la metemos
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
addPerforacionRow() {
  if (!this.form) return;

  const p = this.selectedPila; // pila seleccionada del contexto
  if (!p) {
    // por ahora simple; si ya tienes toast, aquí va un toast
    alert('Selecciona un tipo de pila antes de agregar una fila.');
    return;
  }

  const diametro = p.diametro_proyecto != null ? Number(p.diametro_proyecto) : null;
  const profundidad = p.profundidad_proyecto != null ? Number(p.profundidad_proyecto) : null;

  const row: PerforacionRow = {
    diametro,
    cantidad: 1,
    profundidad,
    metros_comision: profundidad, // por ahora igual a profundidad (regla avanzada después)
    kg_acero: null,
    vol_bentonita: null,
    vol_concreto: null,
    ml_ademe_bauer: 0,
    campana_pzas: 0,
    adicional: null,
    inicio_perf: null,
    termino_perf: null,
  };

  this.form.perforaciones.push(row);
}

  removePerforacionRow(i: number) {
    if (!this.form) return;
    if (this.form.perforaciones.length <= 1) return;
    this.form.perforaciones.splice(i, 1);
  }

  // Recalcular horas (simple)
  recalcHoras(p: PersonalRow) {
    const [hiH, hiM] = p.inicio.split(':').map(Number);
    const [fiH, fiM] = p.fin.split(':').map(Number);

    const inicioMin = hiH * 60 + hiM;
    const finMin = fiH * 60 + fiM;

    let totalMin = finMin - inicioMin;
    if (totalMin < 0) totalMin += 24 * 60; // por si cruzara medianoche

    totalMin -= (Number(p.comida_hrs ?? 0) * 60);

    const horas = Math.max(0, totalMin / 60);
    p.horas_laboradas = Math.round(horas * 100) / 100;
  }

  // Por ahora solo para debug, luego será POST
  debugPrint() {
    console.log('[COMISION FORM]', this.form);
  }
  get selectedPila(): any | null {
  if (!this.ctx || !this.selectedPilaId) return null;
  return (this.ctx.pilas ?? []).find(p => Number(p.id) === Number(this.selectedPilaId)) ?? null;
}
  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
//guardar comision
async guardarComision() {
  if (!this.form) return;

  // Validaciones mínimas MVP
  if (!this.form.obra_id) {
    await this.showToast('Falta obra_id', 'danger');
    return;
  }
  if (!this.form.pila_id) {
    await this.showToast('Selecciona una pila', 'danger');
    return;
  }
  if (!this.form.perforaciones?.length) {
    await this.showToast('Agrega al menos una perforación', 'danger');
    return;
  }

  const loading = await this.loadingCtrl.create({
    message: 'Guardando comisión...',
  });
  await loading.present();

  try {
    // Debug opcional (déjalo por ahora)
    console.log('[COMISION PAYLOAD]', this.form);
      


    const res = await firstValueFrom(this.api.postComisiones(this.form));

    await this.showToast('Comisión guardada correctamente', 'success');
    console.log('[COMISION RESP]', res);

    // Opcional: limpiar o dejar como está
    // this.form.observaciones = null;

  } catch (e: any) {
    console.error('[COMISION ERROR]', e);

    // Si tu handleError regresa mensaje, intenta mostrarlo
    const msg =
      e?.error?.message ||
      e?.message ||
      'Error al guardar la comisión';
    await this.showToast(msg, 'danger');
  } finally {
    await loading.dismiss();
  }
}

}
