import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AlertController, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { MecanicoServicioFormPage } from './mecanico-servicio-form.page';
import { MecanicoOperacionesComponent } from './mecanico-operaciones.component';
import { MecanicoProductosPage } from './mecanico-productos.page';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { MecanicoConsultaService, DetalleServicio } from '../services/mecanico-consulta.service';
import { fechaMexico, MecanicoOperacionService } from '../services/mecanico-operacion.service';
import { MecanicoFotoService } from '../services/mecanico-foto.service';

const catalogos = () => ({ servicios_preventivos: { maquinaria: [{ id: 2, nombre: 'Servicio 250 h', ambito: 'maquinaria' }], vehiculo: [] },
  lectura_sugerida: { campo: 'horometro', valor: 250, unidad: 'horas' }, materiales_por_servicio: {},
  avisos: ['Los vehículos no tienen abastecimiento automático.'], capacidades: { inventario_giralda: true, plantilla_materiales_vehiculo: false, tipos_vehiculo_configurados: false } });
const servicio = (): DetalleServicio => ({ id: 17, estatus: 'borrador', categoria_mantenimiento: 'Preventivo', descripcion: 'Servicio de equipo',
  servicio_preventivo_tipo_id: 2, maquina: { id: 4, nombre: 'Perforadora' }, horometro: 200, fecha_programada: '2026-10-25T16:30:00Z',
  orden: { folio: null, generada_at: null }, materiales: [{ id: 8, producto_id: 5, disponible: 5, producto: 'Aceite', unidad: 'L', cantidad_requerida: 10, incluido: true, motivo_exclusion: null }],
  avance_materiales: [], solicitudes: [], evidencias: [], acciones_permitidas: { editar_borrador: true, generar_orden: true, ajustar_materiales: true,
    solicitar_almacen: true, solicitar_compra: true, agregar_evidencias: true } });

describe('Captura mecánica de borradores', () => {
  let consulta: any; let operaciones: any; let auth: any; let harness: RouterTestingHarness;
  beforeEach(async () => {
    consulta = { listado: jasmine.createSpy('listado').and.returnValue(of({ ok: true, data: [{ id: 4, nombre: 'Perforadora' }], meta: { current_page: 1, last_page: 1, total: 1, per_page: 25 } })),
      detalle: jasmine.createSpy('detalle').and.callFake((recurso: string) => of({ ok: true, data: recurso === 'servicios' ? servicio() : { maquina: { id: 4, nombre: 'Perforadora' } } })) };
    operaciones = { catalogos: jasmine.createSpy('catalogos').and.returnValue(of({ ok: true, data: catalogos() })),
      crear: jasmine.createSpy('crear').and.returnValue(of({ ok: true, data: { id: 55 } })), editar: jasmine.createSpy('editar').and.returnValue(of({ ok: true, data: { id: 17 } })) };
    auth = { logout: jasmine.createSpy('logout') };
    TestBed.configureTestingModule({ imports: [MecanicoServicioFormPage], providers: [provideIonicAngular(), provideRouter([
      { path: 'nueva', component: MecanicoServicioFormPage }, { path: 'editar/:id', component: MecanicoServicioFormPage }]),
      { provide: MecanicoConsultaService, useValue: consulta }, { provide: MecanicoOperacionService, useValue: operaciones }, { provide: AuthService, useValue: auth }] });
    harness = await RouterTestingHarness.create();
  });
  async function abrir(url = '/nueva') { const page = await harness.navigateByUrl(url, MecanicoServicioFormPage); await harness.fixture.whenStable(); harness.detectChanges(); return page; }
  function completar(page: MecanicoServicioFormPage) { page.equipoId = 4; page.tipoId = 2; page.categoria = 'Preventivo'; page.horometro = 250; page.fecha = '2026-10-25T10:30'; }
  it('carga catálogo, equipo y advertencias sin pedir mecánico ni precios', async () => {
    const page = await abrir('/nueva?maquina_id=4'); expect(page.equipoId).toBe(4); expect(page.horometro).toBe(250);
    expect(harness.routeNativeElement?.textContent).not.toContain('Los vehículos no tienen abastecimiento automático.');
    expect(harness.routeNativeElement?.querySelector('[name="mecanico_id"]')).toBeNull(); expect(harness.routeNativeElement?.querySelector('[name="costo_total"]')).toBeNull();
  });
  it('destaca el equipo del borrador y no muestra la busqueda hasta solicitar un cambio', async () => {
    const page = await abrir('/editar/17');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Perforadora');
    expect(harness.routeNativeElement?.querySelector('.selector-equipo')).toBeNull();
    expect(consulta.listado).not.toHaveBeenCalled();
    await page.abrirSelectorEquipo(); harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('.selector-equipo')).not.toBeNull();
    expect(page.equipoId).toBe(4); expect(page.tipoId).toBe(2); expect(page.horometro).toBe(200);
  });
  it('paginar el catalogo no agrega ni cambia el equipo del servicio', async () => {
    const page = await abrir('/editar/17');
    await page.abrirSelectorEquipo();
    consulta.listado.and.returnValue(of({ ok: true, data: [{ id: 9, nombre: 'Otra maquina' }], meta: { current_page: 2, last_page: 2, total: 26, per_page: 25 } }));
    await page.buscarEquipos(2); harness.detectChanges();
    expect(page.equipoId).toBe(4); expect(page.equipoSeleccionado?.nombre).toBe('Perforadora');
    expect(harness.routeNativeElement?.querySelector('.catalogo-paginacion')?.textContent).toContain('Página 2 de 2 del catálogo');
    const selector = harness.routeNativeElement?.querySelector('ion-select[name="equipoId"]') as HTMLIonSelectElement;
    expect(selector.multiple).toBeFalse();
    page.equipoId = 9; await page.seleccionarEquipo();
    expect(page.equipoSeleccionado?.id).toBe(9); expect(page.selectorEquipoAbierto).toBeFalse();
    expect(page.tipoId).toBeNull();
    page.tipoId = 2; spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    await page.guardar();
    const payload = operaciones.editar.calls.mostRecent().args[1];
    expect(payload.maquina_id).toBe(9); expect(payload.vehiculo_id).toBeNull();
  });
  it('los controles de catalogo caben en un formulario de 320 pixeles con nombres largos', async () => {
    const page = await abrir('/editar/17');
    page.equipoSeleccionado = { id: 4, nombre: 'GRUA MANITEX CON UN NOMBRE LARGO PARA IDENTIFICAR EL EQUIPO', codigo: '351240000000000000000000000000000000000000000000000' };
    await page.abrirSelectorEquipo();
    page.meta = { current_page: 1, last_page: 2, total: 26, per_page: 25 };
    const host = harness.routeNativeElement as HTMLElement;
    Object.assign(host.style, { width: '320px', height: '1000px', position: 'relative', display: 'block' });
    harness.detectChanges(); await harness.fixture.whenStable();
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const main = host.querySelector('main') as HTMLElement;
    const fieldset = host.querySelector('fieldset') as HTMLElement;
    expect(fieldset.scrollWidth).toBeLessThanOrEqual(fieldset.clientWidth + 1);
    expect(main.scrollWidth).toBeLessThanOrEqual(main.clientWidth + 1);
    const limite = main.getBoundingClientRect();
    for (const boton of Array.from(host.querySelectorAll('.catalogo-botones ion-button'))) {
      expect(boton.getBoundingClientRect().right).toBeLessThanOrEqual(limite.right + 1);
    }
  });


  it('crea con campos permitidos y navega al servicio, sin enviar actor, precios o estado', async () => {
    const page = await abrir(); completar(page); const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    await page.guardar(); const payload = operaciones.crear.calls.mostRecent().args[0];
    expect(payload.maquina_id).toBe(4); expect(payload.vehiculo_id).toBeNull(); expect(payload.fecha_programada).toBe('2026-10-25T10:30');
    for (const key of ['mecanico_id', 'estatus', 'costo_total', 'detalles', 'obra_id']) expect(payload[key]).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith(['/tabs-mecanico/servicios', 55]);
  });
  it('bloquea envíos simultáneos y una segunda creación después de guardar', async () => {
    const page = await abrir(); completar(page); spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const pending = new Subject<any>(); operaciones.crear.and.returnValue(pending); const first = page.guardar(); await page.guardar();
    expect(operaciones.crear).toHaveBeenCalledTimes(1); pending.next({ ok: true, data: { id: 55 } }); await first; await page.guardar();
    expect(operaciones.crear).toHaveBeenCalledTimes(1);
  });
  it('edita preservando lectura y hora de México del servicio existente', async () => {
    const page = await abrir('/editar/17'); expect(page.horometro).toBe(200); expect(page.fecha).toBe('2026-10-25T10:30');
    expect(fechaMexico('2026-10-25T16:30:00Z')).toBe('2026-10-25T10:30');
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true); await page.guardar(); expect(operaciones.editar.calls.mostRecent().args[0]).toBe(17); expect(operaciones.crear).not.toHaveBeenCalled();
  });
  it('recarga el borrador al reingresar y revalida si todavía admite edición', async () => {
    const page = await abrir('/editar/17'); page.ionViewDidLeave();
    const nuevo = servicio(); nuevo.acciones_permitidas['editar_borrador'] = false; consulta.detalle.and.returnValue(of({ data: nuevo }));
    await page.ionViewWillEnter(); expect(page.bloqueado).toBeTrue(); expect(consulta.detalle).toHaveBeenCalledTimes(2);
    await page.guardar(); expect(operaciones.editar).not.toHaveBeenCalled();
  });
  it('limpia el alta exitosa al volver a programar en una vista conservada por Ionic', async () => {
    const page = await abrir(); completar(page); spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    await page.guardar(); page.ionViewDidLeave(); await page.ionViewWillEnter();
    expect(page.guardadoId).toBeNull(); expect(page.equipoId).toBeNull(); expect(page.fecha).toBe('');
    expect(operaciones.crear).toHaveBeenCalledTimes(1);
  });
  it('no habilita edición cuando el servidor la revocó', async () => {
    const s = servicio(); s.acciones_permitidas['editar_borrador'] = false; consulta.detalle.and.returnValue(of({ data: s }));
    const page = await abrir('/editar/17'); expect(page.bloqueado).toBeTrue(); await page.guardar(); expect(operaciones.editar).not.toHaveBeenCalled();
  });
  it('no crea vehículos sin tipo preventivo configurado', async () => {
    const page = await abrir(); page.tipoEquipo = 'vehiculos'; page.equipoId = 7; page.fecha = '2026-10-25T10:30';
    await page.guardar(); expect(operaciones.crear).not.toHaveBeenCalled(); expect(page.error).toContain('Completa');
  });
  it('muestra validaciones 422 y conserva la captura para corregirla', async () => {
    const page = await abrir(); completar(page); operaciones.crear.and.returnValue(throwError(() => ({ status: 422, error: { errors: { horometro: ['Lectura inferior a la actual'] } } })));
    await page.guardar(); expect(page.error).toBe('Lectura inferior a la actual'); expect(page.horometro).toBe(250); expect(page.incierto).toBeFalse();
  });
  it('ante respuesta incierta no repite automáticamente el alta', async () => {
    const page = await abrir(); completar(page); operaciones.crear.and.returnValue(throwError(() => ({ status: 0 })));
    await page.guardar(); await page.guardar(); expect(page.incierto).toBeTrue(); expect(operaciones.crear).toHaveBeenCalledTimes(1);
  });
});

describe('Operaciones y evidencias mecánicas', () => {
  let operaciones: any; let consulta: any; let foto: any; let alert: any;
  beforeEach(() => {
    const response = { ok: true, data: servicio() };
    operaciones = { generarOrden: jasmine.createSpy('generarOrden').and.returnValue(of(response)), solicitar: jasmine.createSpy('solicitar').and.returnValue(of(response)),
      ajustarMateriales: jasmine.createSpy('ajustarMateriales').and.returnValue(of(response)), evidencias: jasmine.createSpy('evidencias').and.returnValue(of(response)) };
    consulta = { detalle: jasmine.createSpy('detalle').and.returnValue(of(response)) };
    foto = { capturar: jasmine.createSpy('capturar').and.resolveTo(new File(['foto'], 'camara.jpg', { type: 'image/jpeg' })) };
    alert = { create: jasmine.createSpy('create').and.resolveTo({ present: async () => undefined, onDidDismiss: async () => ({ role: 'confirm' }) }) };
    TestBed.configureTestingModule({ imports: [MecanicoOperacionesComponent], providers: [provideIonicAngular(), provideRouter([]),
      { provide: MecanicoOperacionService, useValue: operaciones }, { provide: MecanicoConsultaService, useValue: consulta },
      { provide: MecanicoFotoService, useValue: foto }, { provide: AlertController, useValue: alert },
      { provide: AuthService, useValue: { logout() {}, getMe: () => of({}), setSelectedPanel() {} } }] });
  });
  function crear() { const fixture = TestBed.createComponent(MecanicoOperacionesComponent); fixture.componentRef.setInput('servicio', servicio()); fixture.detectChanges(); return fixture; }
  it('mantiene visible el bloqueo de evidencias y no abre cámara ni envía archivos sin permiso', async () => {
    const f = crear(); const c = f.componentInstance;
    c.servicio.es_propio = true; c.servicio.acciones_permitidas['agregar_evidencias'] = false; f.detectChanges();
    const card = f.nativeElement.querySelector('.evidencias-bloqueadas');
    expect(card.textContent).toContain('Disponible al iniciar el servicio y recibir los materiales requeridos.');
    expect(card.querySelector('input[type="file"]').disabled).toBeTrue();
    expect(Array.from(card.querySelectorAll('ion-button')).every((button: any) => button.disabled)).toBeTrue();
    c.agregarArchivos([new File(['foto'], 'a.jpg', { type: 'image/jpeg' })]);
    await c.tomarFoto(); await c.subirFotos();
    expect(c.fotos.length).toBe(0); expect(foto.capturar).not.toHaveBeenCalled(); expect(operaciones.evidencias).not.toHaveBeenCalled();
    c.servicio.acciones_permitidas['agregar_evidencias'] = true; f.detectChanges();
    expect(f.nativeElement.querySelector('.evidencias-bloqueadas')).toBeNull();
  });
  it('respeta acciones del servidor y permite cancelar la confirmación', async () => {
    const f = crear(); f.componentInstance.servicio.acciones_permitidas['generar_orden'] = false;
    await f.componentInstance.confirmar('generar_orden'); expect(alert.create).not.toHaveBeenCalled();
    f.componentInstance.servicio.acciones_permitidas['generar_orden'] = true;
    alert.create.and.resolveTo({ present: async () => undefined, onDidDismiss: async () => ({ role: 'cancel' }) });
    await f.componentInstance.confirmar('generar_orden'); expect(operaciones.generarOrden).not.toHaveBeenCalled();
  });
  it('bloquea doble confirmación y publica la respuesta de orden', async () => {
    const f = crear(); const emit = spyOn(f.componentInstance.actualizado, 'emit');
    const pending = new Subject<any>(); operaciones.generarOrden.and.returnValue(pending);
    const first = f.componentInstance.confirmar('generar_orden'); await f.componentInstance.confirmar('generar_orden');
    await f.whenStable(); expect(operaciones.generarOrden).toHaveBeenCalledTimes(1);
    pending.next({ ok: true, data: servicio() }); await first; expect(emit).toHaveBeenCalled();
  });
  it('envía solo inclusión y motivos, conservando cantidades y precios', async () => {
    const f = crear(); f.componentInstance.materiales[0].incluido = false; f.componentInstance.materiales[0].motivo_exclusion = 'No aplica';
    await f.componentInstance.guardarMateriales(); expect(operaciones.ajustarMateriales).toHaveBeenCalledWith(17, [{ id: 8, incluido: false, motivo_exclusion: 'No aplica' }]);
  });
  it('muestra requerido y disponible, y recomienda compra total, parcial o surtido directo', () => {
    const f = crear(); const c = f.componentInstance;
    expect(f.nativeElement.textContent).not.toContain('Cantidad original');
    expect(f.nativeElement.querySelector('.cantidad-disponible').textContent).toContain('5');
    expect(c.materialesInventario[0].porComprar).toBe(5);
    c.materiales[0].disponible = 0; f.detectChanges(); expect(c.materialesInventario[0].porComprar).toBe(10);
    c.materiales[0].disponible = 15; f.detectChanges(); expect(c.materialesInventario[0].porComprar).toBe(0);
    expect(f.nativeElement.querySelector('.material-compra').textContent).toContain('Solicita surtido de almacén');
    c.materiales[0].incluido = false; c.materiales[0].motivo_exclusion = 'No aplica'; f.detectChanges();
    expect(c.materialesInventario[0].requerido).toBe(0); expect(c.materialesInventario[0].disponible).toBe(15);
    const motivo = f.nativeElement.querySelector('ion-textarea'); c.materiales[0].motivo_exclusion = 'Ya se cambió'; f.detectChanges();
    expect(f.nativeElement.querySelector('ion-textarea')).toBe(motivo);
    c.materiales[0].incluido = true; expect(c.materialesInventario[0].requerido).toBe(10);
  });
  it('no cuenta dos veces el inventario compartido ni confunde inventario desconocido con cero', () => {
    const f = crear(); const c = f.componentInstance;
    c.materiales.push({ ...c.materiales[0], id: 9 });
    expect(c.materialesInventario.map(m => m.porComprar)).toEqual([5, 10]);
    c.materiales[0].incluido = false;
    expect(c.materialesInventario.map(m => m.porComprar)).toEqual([0, 5]);
    c.materiales[1].disponible = undefined;
    expect(c.materialesInventario[1].disponible).toBeNull(); expect(c.materialesInventario[1].porComprar).toBeNull();
  });
  it('excluir un material muestra cero y exige motivo antes de enviar', async () => {
    const f = crear(); const c = f.componentInstance;
    c.materiales[0].incluido = false; c.materiales[0].motivo_exclusion = '   '; f.detectChanges();
    const cantidades = f.nativeElement.querySelector('.cantidad-efectiva') as HTMLElement;
    expect(cantidades.textContent).toContain('0');
    expect(f.nativeElement.textContent).toContain('No se solicitará');
    await c.guardarMateriales();
    expect(operaciones.ajustarMateriales).not.toHaveBeenCalled();
    expect(c.erroresMateriales[8]).toContain('Explica');
    c.materiales[0].motivo_exclusion = '  Aceite cambiado durante una reparación  ';
    await c.guardarMateriales();
    expect(operaciones.ajustarMateriales).toHaveBeenCalledWith(17, [{ id: 8, incluido: false, motivo_exclusion: 'Aceite cambiado durante una reparación' }]);
  });
  it('no solicita abastecimiento con exclusiones sin guardar', async () => {
    const f = crear(); const c = f.componentInstance;
    c.materiales[0].incluido = false; c.materiales[0].motivo_exclusion = 'Aceite nuevo';
    expect(c.cambiosMateriales).toBeTrue();
    await c.confirmar('solicitar_almacen'); await c.confirmar('solicitar_compra');
    expect(operaciones.solicitar).not.toHaveBeenCalled();
    expect(alert.create).not.toHaveBeenCalled();
    const response = servicio(); response.materiales[0].incluido = false; response.materiales[0].motivo_exclusion = 'Aceite nuevo';
    operaciones.ajustarMateriales.and.returnValue(of({ ok: true, data: response }));
    await c.guardarMateriales(); expect(c.cambiosMateriales).toBeFalse();
    await c.confirmar('solicitar_almacen'); expect(operaciones.solicitar).toHaveBeenCalledWith(17, 'almacen');
  });
  it('reincluir restaura la cantidad original y limpia el motivo enviado', async () => {
    const f = crear(); const c = f.componentInstance;
    c.materiales[0].incluido = false; c.materiales[0].motivo_exclusion = 'Aceite nuevo';
    c.materiales[0].incluido = true; f.detectChanges();
    expect((f.nativeElement.querySelector('.cantidad-efectiva') as HTMLElement).textContent).toContain('10');
    await c.guardarMateriales();
    expect(operaciones.ajustarMateriales).toHaveBeenCalledWith(17, [{ id: 8, incluido: true, motivo_exclusion: null }]);
    expect(c.materiales[0].cantidad_requerida).toBe(10);
  });


  it('solicita almacén o compra con su tipo y sin cantidades del cliente', async () => {
    const f = crear(); await f.componentInstance.confirmar('solicitar_almacen'); expect(operaciones.solicitar).toHaveBeenCalledWith(17, 'almacen');
    await f.componentInstance.confirmar('solicitar_compra'); expect(operaciones.solicitar).toHaveBeenCalledWith(17, 'compra');
  });
  it('rechaza formato, tamaño y capacidad antes de subir', () => {
    const f = crear(); const c = f.componentInstance;
    c.agregarArchivos([new File(['pdf'], 'a.pdf', { type: 'application/pdf' })]); expect(c.fotos.length).toBe(0);
    c.agregarArchivos([new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.jpg', { type: 'image/jpeg' })]); expect(c.fotos.length).toBe(0);
    c.servicio.evidencias = Array.from({ length: 8 }, (_, id) => ({ id, descripcion: null, url: null }));
    c.agregarArchivos([new File(['foto'], 'a.jpg', { type: 'image/jpeg' })]); expect(c.fotos.length).toBe(0); expect(operaciones.evidencias).not.toHaveBeenCalled();
  });
  it('limpia previews al retirar y al destruir, sin subir fotos automáticamente', () => {
    const f = crear(); const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    f.componentInstance.agregarArchivos([new File(['foto'], 'a.jpg', { type: 'image/jpeg' })]); f.componentInstance.quitarFoto(0); expect(revoke).toHaveBeenCalledTimes(1);
    f.componentInstance.agregarArchivos([new File(['foto'], 'b.jpg', { type: 'image/jpeg' })]); f.destroy(); expect(revoke).toHaveBeenCalledTimes(2); expect(operaciones.evidencias).not.toHaveBeenCalled();
  });
  it('captura con cámara bajo acción explícita y elimina selección al guardar', async () => {
    const f = crear(); await f.componentInstance.tomarFoto(); expect(foto.capturar).toHaveBeenCalledTimes(1); expect(f.componentInstance.fotos.length).toBe(1);
    await f.componentInstance.subirFotos(); expect(operaciones.evidencias).toHaveBeenCalledTimes(1); expect(f.componentInstance.fotos.length).toBe(0);
  });
  it('no repite una carga cuyo resultado no se pudo confirmar', async () => {
    const f = crear(); f.componentInstance.agregarArchivos([new File(['foto'], 'a.jpg', { type: 'image/jpeg' })]);
    operaciones.evidencias.and.returnValue(throwError(() => ({ status: 0 }))); await f.componentInstance.subirFotos(); await f.componentInstance.subirFotos();
    expect(f.componentInstance.envioIncierto).toBeTrue(); expect(operaciones.evidencias).toHaveBeenCalledTimes(1); expect(consulta.detalle).toHaveBeenCalled();
  });
  it('relee el detalle tras conflicto y muestra el mensaje', async () => {
    const f = crear(); operaciones.ajustarMateriales.and.returnValue(throwError(() => ({ status: 409, message: 'Ya existe solicitud' })));
    await f.componentInstance.guardarMateriales(); expect(consulta.detalle).toHaveBeenCalledWith('servicios', 17); expect(f.componentInstance.error).toBe('Ya existe solicitud');
  });
});

describe('Productos mecánicos de consulta', () => {
  it('muestra unidades y stock sin permitir edición ni agregar materiales al snapshot', async () => {
    const productos = { data: [{ id: 5, nombre: 'Aceite', sku: 'ACE', unidad_stock: 'L', tiene_registro_stock: false, stock: { stock_actual: 0, stock_reservado: 0, disponible: 0 } }], meta: { current_page: 1, last_page: 1, total: 1, per_page: 25 } };
    const mock = { productos: jasmine.createSpy('productos').and.returnValue(of(productos)) };
    TestBed.configureTestingModule({ imports: [MecanicoProductosPage], providers: [provideIonicAngular(), provideRouter([{ path: 'productos', component: MecanicoProductosPage }]),
      { provide: MecanicoOperacionService, useValue: mock }, { provide: AuthService, useValue: { logout() {} } }] });
    const harness = await RouterTestingHarness.create(); const page = await harness.navigateByUrl('/productos?servicio=17', MecanicoProductosPage);
    await harness.fixture.whenStable(); harness.detectChanges(); expect(harness.routeNativeElement?.textContent).toContain('Sin registro de stock');
    expect(harness.routeNativeElement?.textContent).toContain('Disponible: 0'); expect(page.regreso).toEqual(['/tabs-mecanico/servicios', 17]);
  });
});

describe('Contratos de escritura mecánicos', () => {
  let http: HttpTestingController; let api: MecanicoOperacionService;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), ApiService, MecanicoOperacionService] }); http = TestBed.inject(HttpTestingController); api = TestBed.inject(MecanicoOperacionService); });
  afterEach(() => http.verify());
  it('usa POST de orden con cuerpo vacío y PATCH de materiales', async () => {
    const p1 = firstValueFrom(api.generarOrden(17)); const r1 = http.expectOne(r => r.url.endsWith('/mecanico/servicios/17/generar-orden')); expect(r1.request.body).toEqual({}); r1.flush({ ok: true, data: servicio() }); await p1;
    const p2 = firstValueFrom(api.ajustarMateriales(17, [{ id: 8, incluido: false, motivo_exclusion: 'No aplica' }])); const r2 = http.expectOne(r => r.url.endsWith('/mecanico/servicios/17/materiales')); expect(r2.request.method).toBe('PATCH'); r2.flush({ ok: true, data: servicio() }); await p2;
  });
  it('envía multipart por índices sin Content-Type JSON ni obra automática', async () => {
    sessionStorage.setItem('selected_obra_id', '99');
    try {
      const file = new File(['foto'], 'a.png', { type: 'image/png' }); const promise = firstValueFrom(api.evidencias(17, [{ archivo: file, descripcion: 'Motor' }]));
      const req = http.expectOne(r => r.url.endsWith('/mecanico/servicios/17/evidencias'));
      expect(req.request.headers.has('Content-Type')).toBeFalse(); expect(req.request.body.get('fotos[0]').name).toBe('a.png'); expect(req.request.body.get('foto_descripciones[0]')).toBe('Motor'); expect(req.request.body.has('obra_id')).toBeFalse();
      req.flush({ ok: true, data: servicio() }); await promise;
    } finally { sessionStorage.removeItem('selected_obra_id'); }
  });
});
