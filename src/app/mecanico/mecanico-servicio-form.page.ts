import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonInput, IonSelect, IonSelectOption, IonSearchbar, IonTextarea, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { carOutline, constructOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth';
import { DetalleEquipo, DetalleServicio, FilaMecanico, MetaMecanico, MecanicoConsultaService } from '../services/mecanico-consulta.service';
import { BorradorMecanico, CatalogosMecanico, fechaMexico, mensajeOperacion, MecanicoOperacionService } from '../services/mecanico-operacion.service';

@Component({ standalone: true, selector: 'app-mecanico-servicio-form', templateUrl: './mecanico-servicio-form.page.html',
  styleUrls: ['./mecanico-servicio-form.page.scss'], imports: [CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonButton, IonContent, IonInput, IonSelect, IonSelectOption, IonSearchbar, IonTextarea, IonSpinner, IonIcon] })
export class MecanicoServicioFormPage implements OnInit, OnDestroy {
  id: number | null = null; guardadoId: number | null = null; tipoEquipo: 'maquinas' | 'vehiculos' = 'maquinas';
  equipoId: number | null = null; equipoSeleccionado: FilaMecanico | null = null; equipos: FilaMecanico[] = [];
  equipoBusqueda = ''; meta: MetaMecanico | null = null; catalogos: CatalogosMecanico | null = null;
  categoria = ''; selectorEquipoAbierto = true; descripcion = ''; fecha = ''; tipoId: number | null = null;
  horometro: number | null = null; km: number | null = null; kmProximo: number | null = null;
  cargando = false; buscando = false; cargandoCatalogos = false; guardando = false; bloqueado = false; incierto = false;
  error = ''; errorEquipos = ''; private secuencia = 0; private secuenciaCatalogos = 0; private muerto = false;
  readonly iconos = { maquina: constructOutline, vehiculo: carOutline };
  constructor(private route: ActivatedRoute, private router: Router, private consulta: MecanicoConsultaService,
    private operaciones: MecanicoOperacionService, private auth: AuthService) {}
  get tipos() { return this.catalogos?.servicios_preventivos[this.tipoEquipo === 'maquinas' ? 'maquinaria' : 'vehiculo'] ?? []; }
  get avisosCatalogo() { return (this.catalogos?.avisos ?? []).filter(aviso => this.tipoEquipo === 'vehiculos' || !/veh[ií]culo/i.test(aviso)); }
  get sugeridos() { return this.catalogos?.materiales_por_servicio[String(this.tipoId)] ?? []; }
  get seleccionadoFueraPagina() { return this.equipoSeleccionado && !this.equipos.some(e => e.id === this.equipoId); }
  nombre(e: FilaMecanico) { return e.nombre || [e.marca, e.modelo].filter(Boolean).join(' ') || e.placas || 'Equipo'; }
  ngOnDestroy() { this.muerto = true; this.secuencia++; this.secuenciaCatalogos++; }
  private regreso = false;
  ionViewDidLeave() { this.regreso = true; }
  async ionViewWillEnter() {
    if (!this.regreso) return;
    this.regreso = false;
    if (this.guardando || this.incierto) return;
    this.secuencia++; this.secuenciaCatalogos++;
    Object.assign(this, { id: null, guardadoId: null, selectorEquipoAbierto: true, tipoEquipo: 'maquinas', equipoId: null, equipoSeleccionado: null,
      equipos: [], equipoBusqueda: '', meta: null, catalogos: null, categoria: '', descripcion: '', fecha: '', tipoId: null,
      horometro: null, km: null, kmProximo: null, bloqueado: false, error: '', errorEquipos: '' });
    await this.ngOnInit();
  }
  async ngOnInit() {
    this.cargando = true;
    try {
      const raw = this.route.snapshot.paramMap.get('id');
      if (raw) {
        this.id = Number(raw);
        if (!Number.isInteger(this.id) || this.id < 1) throw new Error('Servicio no válido.');
        const response = await firstValueFrom(this.consulta.detalle('servicios', this.id));
        const s = response.data as DetalleServicio;
        if (!s.acciones_permitidas['editar_borrador']) { this.bloqueado = true; throw new Error('Este servicio ya no admite edición de borrador.'); }
        this.tipoEquipo = s.maquina ? 'maquinas' : 'vehiculos'; this.equipoSeleccionado = s.maquina ?? s.vehiculo ?? null;
        this.equipoId = this.equipoSeleccionado?.id ?? null; this.tipoId = s.servicio_preventivo_tipo_id ?? null;
        this.categoria = s.categoria_mantenimiento ?? ''; this.descripcion = s.descripcion ?? ''; this.fecha = fechaMexico(s.fecha_programada);
        this.horometro = s.horometro ?? null; this.km = s.km_actuales ?? null; this.kmProximo = s.km_proximo_servicio ?? null;
      } else {
        const m = this.route.snapshot.queryParamMap.get('maquina_id'); const v = this.route.snapshot.queryParamMap.get('vehiculo_id');
        if (m && v) throw new Error('Selecciona un solo equipo para programar el servicio.');
        if (m || v) {
          this.equipoId = Number(m || v); this.tipoEquipo = m ? 'maquinas' : 'vehiculos';
          if (!Number.isInteger(this.equipoId) || this.equipoId < 1) throw new Error('Equipo no válido.');
          const response = await firstValueFrom(this.consulta.detalle(this.tipoEquipo, this.equipoId));
          const data = response.data as DetalleEquipo; this.equipoSeleccionado = data.maquina ?? data.vehiculo ?? null;
        }
      }
      await this.cargarCatalogos(!this.id);
      this.selectorEquipoAbierto = !this.equipoId;
      if (this.selectorEquipoAbierto) await this.buscarEquipos();
    } catch (error: any) { this.error = mensajeOperacion(error); if (error?.status === 401) this.auth.logout(); }
    finally { this.cargando = false; }
  }
  async abrirSelectorEquipo() {
    if (this.guardando || this.incierto || this.guardadoId) return;
    this.selectorEquipoAbierto = true; await this.buscarEquipos();
  }
  async buscarEquipos(page = 1) {
    const turno = ++this.secuencia; this.buscando = true; this.errorEquipos = '';
    try {
      const res = await firstValueFrom(this.consulta.listado(this.tipoEquipo, { page, q: this.equipoBusqueda }));
      if (turno !== this.secuencia || this.muerto) return; this.equipos = res.data; this.meta = res.meta;
    } catch (error: any) { if (turno === this.secuencia) this.errorEquipos = mensajeOperacion(error); if (error?.status === 401) this.auth.logout(); }
    finally { if (turno === this.secuencia) this.buscando = false; }
  }
  async cambiarTipo() {
    this.equipoId = null; this.equipoSeleccionado = null; this.tipoId = null; this.horometro = null; this.km = null; this.kmProximo = null;
    this.equipoBusqueda = ''; this.equipos = []; this.meta = null; this.catalogos = null; this.secuenciaCatalogos++;
    await this.cargarCatalogos(false); await this.buscarEquipos();
  }
  async seleccionarEquipo() {
    if (this.equipoSeleccionado?.id === this.equipoId) { this.selectorEquipoAbierto = false; return; }
    this.equipoSeleccionado = this.equipos.find(e => e.id === this.equipoId) ?? this.equipoSeleccionado;
    this.tipoId = null; this.horometro = null; this.km = null; this.kmProximo = null;
    await this.cargarCatalogos(true);
    this.selectorEquipoAbierto = !this.equipoId;
  }
  async cargarCatalogos(aplicarLectura: boolean) {
    const turno = ++this.secuenciaCatalogos; this.cargandoCatalogos = true; this.error = '';
    try {
      const filtro = this.equipoId ? (this.tipoEquipo === 'maquinas' ? { maquina_id: this.equipoId } : { vehiculo_id: this.equipoId }) : undefined;
      const res = await firstValueFrom(this.operaciones.catalogos(filtro));
      if (turno !== this.secuenciaCatalogos || this.muerto) return;
      this.catalogos = res.data;
      if (aplicarLectura && res.data.lectura_sugerida?.valor != null) {
        if (this.tipoEquipo === 'maquinas') this.horometro = res.data.lectura_sugerida.valor; else this.km = res.data.lectura_sugerida.valor;
      }
    } catch (error: any) { if (turno === this.secuenciaCatalogos) { this.catalogos = null; this.error = mensajeOperacion(error); } if (error?.status === 401) this.auth.logout(); }
    finally { if (turno === this.secuenciaCatalogos) this.cargandoCatalogos = false; }
  }
  async guardar() {
    if (this.guardando || this.bloqueado || this.incierto || this.guardadoId) return;
    if (!this.equipoId || !this.tipoId || !this.categoria.trim() || !this.fecha || !this.catalogos) { this.error = 'Completa equipo, tipo preventivo, categoría y fecha programada.'; return; }
    if (this.tipoEquipo === 'maquinas' && this.horometro == null) { this.error = 'Captura el horómetro de la máquina.'; return; }
    if (!this.tipos.some(t => t.id === this.tipoId)) { this.error = 'Selecciona un tipo preventivo disponible para este equipo.'; return; }
    this.guardando = true; this.error = '';
    const payload: BorradorMecanico = { maquina_id: this.tipoEquipo === 'maquinas' ? this.equipoId : null,
      vehiculo_id: this.tipoEquipo === 'vehiculos' ? this.equipoId : null, categoria_mantenimiento: this.categoria.trim(),
      servicio_preventivo_tipo_id: this.tipoId, descripcion: this.descripcion.trim() || null, fecha_programada: this.fecha,
      horometro: this.tipoEquipo === 'maquinas' ? this.horometro : null,
      km_actuales: this.tipoEquipo === 'vehiculos' ? this.km : null, km_proximo_servicio: this.tipoEquipo === 'vehiculos' ? this.kmProximo : null };
    try {
      const res = await firstValueFrom(this.id ? this.operaciones.editar(this.id, payload) : this.operaciones.crear(payload));
      this.guardadoId = res.data.id; await this.router.navigate(['/tabs-mecanico/servicios', res.data.id]);
    } catch (error: any) {
      this.error = mensajeOperacion(error);
      if (error?.status === 401) this.auth.logout();
      if (error?.status === 409 || error?.status === 403) this.bloqueado = true;
      if (!this.id && (error?.status === 0 || error?.status >= 500)) { this.incierto = true; this.error = 'No se pudo confirmar el guardado. Revisa el listado de servicios antes de intentar crear otro.'; }
    } finally { this.guardando = false; }
  }
}
