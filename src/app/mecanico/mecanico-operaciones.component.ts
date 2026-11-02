import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlertController, IonButton, IonCheckbox, IonInput, IonTextarea } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';
import { DetalleServicio, MecanicoConsultaService } from '../services/mecanico-consulta.service';
import { CierreMecanico, fechaEjecucionMexico, fechaMexico, mensajeOperacion, MecanicoOperacionService, RespuestaServicio } from '../services/mecanico-operacion.service';
import { MecanicoFotoService } from '../services/mecanico-foto.service';

@Component({ standalone: true, selector: 'app-mecanico-operaciones', templateUrl: './mecanico-operaciones.component.html',
  styleUrls: ['./mecanico-consulta.page.scss', './mecanico-operaciones.component.scss'], imports: [CommonModule, FormsModule, RouterLink, IonButton, IonCheckbox, IonInput, IonTextarea] })
export class MecanicoOperacionesComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) servicio!: DetalleServicio;
  @Output() actualizado = new EventEmitter<DetalleServicio>();
  materiales: DetalleServicio['materiales'] = [];
  erroresMateriales: Record<number, string> = {};
  fotos: { archivo: File; descripcion: string; preview: string }[] = [];
  ocupado = false; camara = false; error = ''; aviso = ''; envioIncierto = false; private muerto = false;
  constructor(private operaciones: MecanicoOperacionService, private consulta: MecanicoConsultaService,
    private imagenes: MecanicoFotoService, private alert: AlertController, private auth: AuthService, private router: Router) {}
  ejecucion: 'iniciar' | 'completar' | null = null;
  fechaEjecucion = ''; lecturaFinal: number | null = null; notasEjecucion = '';
  erroresEjecucion: Record<string, string> = {}; ejecucionIncierta = false; private servicioEjecucionId: number | null = null;
  ngOnChanges() {
    this.erroresMateriales = {};
    this.materiales = this.servicio.materiales.map(m => ({ ...m }));
    if (this.servicioEjecucionId !== this.servicio.id) {
      this.ejecucionIncierta = false; this.cerrarEjecucion(); this.servicioEjecucionId = this.servicio.id;
    } else if (this.ejecucion && !this.permite(this.ejecucion)) this.cerrarEjecucion();
  }
  horaMexico(fecha: string | null | undefined) { return fechaMexico(fecha).replace('T', ' '); }
  get esMaquina() { return !!(this.servicio.maquina_id || this.servicio.maquina); }
  get campoLectura() { return this.esMaquina ? 'horometro' : 'km_actuales'; }
  get lecturaMinima() { return Math.max(0, Number((this.esMaquina ? this.servicio.horometro : this.servicio.km_actuales) ?? 0)); }
  get materialesPendientes() { return this.servicio.avance_materiales.some(m => m.faltante > 0.0005); }
  abrirEjecucion(accion: 'iniciar' | 'completar') {
    if (this.ocupado || this.camara || this.ejecucionIncierta || !this.permite(accion)) return;
    this.ejecucion = accion; this.fechaEjecucion = fechaMexico(new Date().toISOString());
    this.lecturaFinal = this.esMaquina ? this.servicio.horometro ?? null : this.servicio.km_actuales ?? null;
    this.notasEjecucion = this.servicio.notas ?? ''; this.erroresEjecucion = {}; this.error = ''; this.aviso = '';
  }
  cerrarEjecucion() { this.ejecucion = null; this.erroresEjecucion = {}; }
  async guardarEjecucion() {
    const accion = this.ejecucion; const id = this.servicio.id;
    if (!accion || this.ocupado || this.camara || this.ejecucionIncierta || !this.permite(accion)) return;
    this.erroresEjecucion = {}; this.error = ''; this.aviso = '';
    const fecha = fechaEjecucionMexico(this.fechaEjecucion);
    const campoFecha = accion === 'iniciar' ? 'fecha_inicio' : 'fecha_fin';
    if (!fecha) this.erroresEjecucion[campoFecha] = 'Captura una fecha y hora válidas.';
    if (accion === 'completar') {
      const inicio = fechaMexico(this.servicio.fecha_inicio);
      if (!inicio || (fecha && this.fechaEjecucion <= inicio)) this.erroresEjecucion['fecha_fin'] = 'El fin debe ser posterior al inicio registrado.';
      if (this.lecturaFinal == null || !Number.isFinite(Number(this.lecturaFinal)) || Number(this.lecturaFinal) < this.lecturaMinima
        || (!this.esMaquina && !Number.isInteger(Number(this.lecturaFinal)))) {
        this.erroresEjecucion[this.campoLectura] = this.esMaquina
          ? 'Captura un horómetro igual o mayor que la lectura del servicio.' : 'Captura kilómetros enteros iguales o mayores que la lectura del servicio.';
      }
      if (this.notasEjecucion.length > 5000) this.erroresEjecucion['notas'] = 'Las notas admiten hasta 5000 caracteres.';
      if (!!(this.servicio.maquina_id || this.servicio.maquina) === !!(this.servicio.vehiculo_id || this.servicio.vehiculo)) {
        this.error = 'No se pudo identificar un único equipo. Actualiza el estado del servicio.'; return;
      }
    }
    if (Object.keys(this.erroresEjecucion).length || !fecha) return;
    const cierre: CierreMecanico = { fecha_fin: fecha, notas: this.notasEjecucion.trim() || null,
      ...(this.esMaquina ? { horometro: Number(this.lecturaFinal) } : { km_actuales: Number(this.lecturaFinal) }) };
    this.ocupado = true;
    try {
      const confirmacion = await this.alert.create({ header: accion === 'iniciar' ? 'Iniciar servicio' : 'Completar servicio',
        message: accion === 'iniciar' ? 'Se registrará el inicio. Puedes continuar aunque existan materiales pendientes.'
          : 'Se registrará el cierre con la lectura final y se calculará la mano de obra. El servidor verificará el surtido de los materiales incluidos.',
        buttons: [{ text: 'Volver', role: 'cancel' }, { text: accion === 'iniciar' ? 'Iniciar' : 'Completar', role: 'confirm' }] });
      await confirmacion.present(); const respuesta = await confirmacion.onDidDismiss();
      if (respuesta.role !== 'confirm' || this.muerto || id !== this.servicio.id || this.ejecucion !== accion || !this.permite(accion)) return;
      const response = await firstValueFrom(accion === 'iniciar' ? this.operaciones.iniciar(id, fecha) : this.operaciones.completar(id, cierre));
      if (this.muerto || id !== this.servicio.id) return;
      this.cerrarEjecucion(); this.aplicar(response, accion === 'iniciar' ? 'Servicio iniciado.' : 'Servicio completado.');
    } catch (error: any) {
      if (this.muerto || id !== this.servicio.id) return;
      for (const [campo, mensajes] of Object.entries(error?.error?.errors ?? {})) {
        this.erroresEjecucion[campo] = Array.isArray(mensajes) ? mensajes.join(' ') : String(mensajes);
      }
      this.ejecucionIncierta = error?.status === 0 || error?.status >= 500;
      await this.manejarError(error);
      if (this.ejecucionIncierta) this.error = 'No se pudo confirmar la ejecución. Actualiza el estado del servicio antes de volver a enviarla.';
    } finally { this.ocupado = false; }
  }
  async actualizarEjecucion() {
    if (this.ocupado || this.camara) return;
    this.ocupado = true; const id = this.servicio.id;
    try {
      const response = await firstValueFrom(this.consulta.detalle('servicios', id));
      if (this.muerto || id !== this.servicio.id) return;
      this.ejecucionIncierta = false; this.error = ''; this.aplicar({ ok: true, data: response.data as DetalleServicio }, 'Estado actualizado. Revisa los datos antes de continuar.');
    } catch (error: any) { await this.manejarError(error); }
    finally { this.ocupado = false; }
  }
  ngOnDestroy() { this.muerto = true; this.limpiarFotos(); }
  permite(accion: string) { return this.servicio.acciones_permitidas[accion] === true; }
  get cambiosMateriales() {
    return this.materiales.some(m => {
      const original = this.servicio.materiales.find(fila => fila.id === m.id);
      return !original || m.incluido !== original.incluido ||
        (!m.incluido && (m.motivo_exclusion ?? '').trim() !== (original.motivo_exclusion ?? '').trim());
    });
  }
  get materialesInventario() {
    const restante = new Map<number, number>();
    return this.materiales.map(material => {
      const avance = this.servicio.avance_materiales.find(fila =>
        fila.material_id != null ? fila.material_id === material.id :
        material.material_preventivo_id != null ? fila.material_preventivo_id === material.material_preventivo_id :
        material.producto_id != null && fila.producto_id === material.producto_id);
      const dato = material.disponible ?? avance?.disponible;
      const disponible = dato != null && Number.isFinite(Number(dato)) ? Math.max(0, Number(dato)) : null;
      const requerido = material.incluido ? material.cantidad_requerida : 0;
      const clave = material.producto_id ?? -material.id;
      let surtir: number | null = material.incluido ? null : 0;
      let porComprar: number | null = material.incluido ? null : 0;
      if (disponible !== null) {
        const saldo = restante.get(clave) ?? disponible;
        surtir = Math.min(requerido, saldo); porComprar = Math.max(0, requerido - surtir);
        restante.set(clave, Math.max(0, saldo - surtir));
      }
      return { material, requerido, disponible, surtir, porComprar };
    });
  }
  idMaterialInventario(_indice: number, item: { material: { id: number } }) { return item.material.id; }
  get capacidad() { return Math.max(0, 8 - this.servicio.evidencias.length); }
  async confirmar(accion: 'generar_orden' | 'solicitar_almacen' | 'solicitar_compra') {
    if (this.ocupado || !this.permite(accion)) return;
    if (accion !== 'generar_orden' && this.cambiosMateriales) { this.error = 'Guarda los ajustes de materiales antes de solicitar abastecimiento.'; return; }
    this.ocupado = true; this.error = ''; this.aviso = '';
    try {
      const esOrden = accion === 'generar_orden';
      const confirmacion = await this.alert.create({ header: esOrden ? 'Generar orden' : 'Solicitar abastecimiento',
        message: esOrden ? 'Se creará la orden con los materiales sugeridos. Después podrás excluir partidas con un motivo antes de solicitar abastecimiento. ¿Continuar?'
          : accion === 'solicitar_compra' ? 'Se solicitará comprar solo lo que no cubre el inventario disponible de Giralda. Se bloqueará el ajuste de materiales. ¿Continuar?'
          : 'Se solicitará el surtido pendiente desde almacén, que puede atenderse en entregas parciales. Esta solicitud no descuenta existencias. ¿Continuar?',
        buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Continuar', role: 'confirm' }] });
      await confirmacion.present();
      const result = await confirmacion.onDidDismiss();
      if (result.role !== 'confirm' || this.muerto) return;
      const response = await firstValueFrom(esOrden ? this.operaciones.generarOrden(this.servicio.id)
        : this.operaciones.solicitar(this.servicio.id, accion === 'solicitar_almacen' ? 'almacen' : 'compra'));
      this.aplicar(response, esOrden ? 'Orden generada.' : 'Solicitud registrada.');
    } catch (error: any) { await this.manejarError(error); }
    finally { this.ocupado = false; }
  }
  async guardarMateriales() {
    if (this.ocupado || !this.permite('ajustar_materiales') || !this.materiales.length) return;
    this.erroresMateriales = {};
    for (const material of this.materiales) {
      if (!material.incluido && !(material.motivo_exclusion ?? '').trim()) {
        this.erroresMateriales[material.id] = 'Explica por qué no se aplicará este material.';
      }
    }
    if (Object.keys(this.erroresMateriales).length) { this.error = 'Indica el motivo de cada material que no se aplicará.'; return; }
    this.ocupado = true; this.error = ''; this.aviso = '';
    try {
      const response = await firstValueFrom(this.operaciones.ajustarMateriales(this.servicio.id,
        this.materiales.map(m => ({ id: m.id, incluido: m.incluido, motivo_exclusion: m.incluido ? null : (m.motivo_exclusion ?? '').trim() }))));
      this.aplicar(response, 'Selección de materiales guardada.');
    } catch (error: any) { await this.manejarError(error); }
    finally { this.ocupado = false; }
  }
  elegirArchivos(event: Event) {
    const input = event.target as HTMLInputElement;
    this.agregarArchivos(Array.from(input.files ?? [])); input.value = '';
  }
  agregarArchivos(archivos: File[]) {
    if (this.ocupado || this.muerto || !this.permite('agregar_evidencias')) return;
    this.error = '';
    if (this.fotos.length + archivos.length > this.capacidad) { this.error = 'El servicio admite ocho fotos en total. Retira archivos de la selección.'; return; }
    if (archivos.some(f => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 10 * 1024 * 1024)) {
      this.error = 'Selecciona imágenes JPG, PNG o WebP de hasta 10 MB cada una.'; return;
    }
    this.fotos.push(...archivos.map(archivo => ({ archivo, descripcion: '', preview: URL.createObjectURL(archivo) })));
  }
  quitarFoto(index: number) { if (this.ocupado) return; const foto = this.fotos.splice(index, 1)[0]; if (foto) URL.revokeObjectURL(foto.preview); }
  private limpiarFotos() { this.fotos.forEach(f => URL.revokeObjectURL(f.preview)); this.fotos = []; }
  async tomarFoto() {
    if (this.camara || this.ocupado || !this.permite('agregar_evidencias')) return;
    this.camara = true; this.error = '';
    try { const foto = await this.imagenes.capturar(); if (foto && !this.muerto) this.agregarArchivos([foto]); }
    catch (error: any) { this.error = error?.message || 'No se pudo tomar la fotografía.'; }
    finally { this.camara = false; }
  }
  async subirFotos() {
    if (this.ocupado || this.envioIncierto || !this.permite('agregar_evidencias') || !this.fotos.length || this.fotos.length > this.capacidad) return;
    this.ocupado = true; this.error = ''; this.aviso = '';
    try {
      const response = await firstValueFrom(this.operaciones.evidencias(this.servicio.id, this.fotos));
      this.limpiarFotos(); this.aplicar(response, 'Evidencias guardadas.');
    } catch (error: any) {
      if (error?.status === 0 || error?.status >= 500) this.envioIncierto = true;
      await this.manejarError(error);
      if (this.envioIncierto) this.error = 'No se pudo confirmar la carga. Revisa las evidencias del servicio antes de repetirla.';
    } finally { this.ocupado = false; }
  }
  private aplicar(response: RespuestaServicio, aviso: string) { if (!this.muerto) { this.servicio = response.data; this.ngOnChanges(); this.aviso = aviso; this.actualizado.emit(response.data); } }
  private async manejarError(error: any) {
    this.error = mensajeOperacion(error);
    if (error?.status === 401) { this.auth.logout(); return; }
    if (error?.status === 403) {
      try { await firstValueFrom(this.auth.getMe()); this.auth.setSelectedPanel(null); await this.router.navigate(['/home']); }
      catch { this.auth.logout(); }
      return;
    }
    if (error?.status === 409 || error?.status === 0 || error?.status >= 500) {
      try { const res = await firstValueFrom(this.consulta.detalle('servicios', this.servicio.id)); if (!this.muerto) { this.servicio = res.data as DetalleServicio; this.ngOnChanges(); this.actualizado.emit(this.servicio); } }
      catch { /* El mensaje original y la selección quedan visibles para revisión. */ }
    }
  }
}
