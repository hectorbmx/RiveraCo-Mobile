import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AlertController, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { MecanicoOperacionesComponent } from './mecanico-operaciones.component';
import { DetalleServicio, MecanicoConsultaService } from '../services/mecanico-consulta.service';
import { fechaEjecucionMexico, fechaMexico, MecanicoOperacionService } from '../services/mecanico-operacion.service';
import { MecanicoFotoService } from '../services/mecanico-foto.service';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';

const orden = (): DetalleServicio => ({ id: 17, es_propio: true, estatus: 'orden_generada', maquina_id: 4,
  maquina: { id: 4, nombre: 'Equipo' }, horometro: 100, orden: { folio: 'OS-17', generada_at: null },
  materiales: [{ id: 1, producto: 'Aceite', cantidad_requerida: 10, incluido: true, unidad: 'L', motivo_exclusion: null }],
  avance_materiales: [{ producto: 'Aceite', requerido: 10, surtido: 0, faltante: 10, disponible: 20, estado: 'disponible' }],
  solicitudes: [], evidencias: [], acciones_permitidas: { iniciar: true, completar: false, agregar_evidencias: true } });
const enProceso = (surtido = true): DetalleServicio => ({ ...orden(), estatus: 'en_proceso', fecha_inicio: '2026-10-25T14:00:00Z',
  avance_materiales: surtido ? [] : orden().avance_materiales,
  acciones_permitidas: { iniciar: false, completar: surtido, agregar_evidencias: true } });
const terminado = (): DetalleServicio => ({ ...enProceso(), estatus: 'completado', fecha_fin: '2026-10-25T16:00:00Z',
  horometro: 110, costo_total: 200, notas: 'Realizado', acciones_permitidas: { iniciar: false, completar: false, agregar_evidencias: true } });

describe('Ejecución móvil C13.5', () => {
  let operaciones: any; let consulta: any; let alert: any; let auth: any;
  beforeEach(() => {
    operaciones = { iniciar: jasmine.createSpy('iniciar').and.returnValue(of({ ok: true, data: enProceso(false) })),
      completar: jasmine.createSpy('completar').and.returnValue(of({ ok: true, data: terminado() })),
      evidencias: jasmine.createSpy('evidencias').and.returnValue(of({ ok: true, data: orden() })) };
    consulta = { detalle: jasmine.createSpy('detalle').and.returnValue(of({ ok: true, data: orden() })) };
    alert = { create: jasmine.createSpy('create').and.resolveTo({ present: async () => undefined, onDidDismiss: async () => ({ role: 'confirm' }) }) };
    auth = { logout: jasmine.createSpy('logout'), getMe: jasmine.createSpy('getMe').and.returnValue(of({})), setSelectedPanel: jasmine.createSpy('setSelectedPanel') };
    TestBed.configureTestingModule({ imports: [MecanicoOperacionesComponent], providers: [provideIonicAngular(), provideRouter([]),
      { provide: MecanicoOperacionService, useValue: operaciones }, { provide: MecanicoConsultaService, useValue: consulta },
      { provide: AlertController, useValue: alert }, { provide: AuthService, useValue: auth },
      { provide: MecanicoFotoService, useValue: { capturar: async () => null } }] });
  });
  function crear(s: DetalleServicio = orden()) {
    const f = TestBed.createComponent(MecanicoOperacionesComponent); f.componentRef.setInput('servicio', s); f.detectChanges(); return f;
  }
  function cierre(c: MecanicoOperacionesComponent) { c.abrirEjecucion('completar'); c.fechaEjecucion = '2026-10-25T10:00'; c.lecturaFinal = 110; c.notasEjecucion = 'Realizado'; }

  it('ocultar ejecución conserva la captura sin enviar el cierre', () => {
    const f = crear(enProceso()); const c = f.componentInstance;
    c.abrirEjecucion('completar'); c.fechaEjecucion = '2026-10-25T10:00'; c.notasEjecucion = 'Trabajo revisado'; f.detectChanges();
    const card = f.nativeElement.querySelector('details.card-ejecucion') as HTMLDetailsElement;
    expect(card.open).toBeTrue();
    (card.querySelector('summary') as HTMLElement).click(); f.detectChanges(); expect(card.open).toBeFalse();
    expect(c.fechaEjecucion).toBe('2026-10-25T10:00'); expect(c.notasEjecucion).toBe('Trabajo revisado');
    expect(operaciones.completar).not.toHaveBeenCalled();
    (card.querySelector('summary') as HTMLElement).click(); expect(card.open).toBeTrue();
  });
  it('mantiene completar y actualizar en la misma fila a 320 y 390 px', async () => {
    const f = crear(enProceso());
    f.nativeElement.style.display = 'block';
    const card = f.nativeElement.querySelector('details.card-ejecucion') as HTMLDetailsElement;
    (card.querySelector('summary') as HTMLElement).click(); await f.whenStable();
    const botones = card.querySelectorAll('.ejecucion-botones ion-button'); expect(botones.length).toBe(2);
    for (const ancho of [320, 390]) {
      f.nativeElement.style.width = `${ancho}px`;
      const completar = botones[0].getBoundingClientRect(); const actualizar = botones[1].getBoundingClientRect();
      expect(completar.width).toBeGreaterThan(0); expect(actualizar.left).toBeGreaterThan(completar.left);
      expect(Math.abs(completar.top - actualizar.top)).toBeLessThan(2);
      expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
    }
  });
  it('recorre inicio con faltantes, actualización tras surtido y cierre sin enviar costos ni actor', async () => {
    const f = crear(); const c = f.componentInstance; const emit = spyOn(c.actualizado, 'emit');
    c.abrirEjecucion('iniciar'); c.fechaEjecucion = '2026-10-25T08:00'; await c.guardarEjecucion();
    expect(operaciones.iniciar).toHaveBeenCalledOnceWith(17, '2026-10-25T08:00:00');
    f.detectChanges(); expect(f.nativeElement.textContent).toContain('pendientes de surtir');
    c.abrirEjecucion('completar'); expect(c.ejecucion).toBeNull();
    consulta.detalle.and.returnValue(of({ ok: true, data: enProceso() })); await c.actualizarEjecucion();
    cierre(c); await c.guardarEjecucion();
    expect(operaciones.completar).toHaveBeenCalledOnceWith(17, { fecha_fin: '2026-10-25T10:00:00', horometro: 110, notas: 'Realizado' });
    expect(emit.calls.mostRecent().args[0]?.estatus).toBe('completado'); expect(c.servicio.costo_total).toBe(200);
    c.abrirEjecucion('completar'); await c.guardarEjecucion(); expect(operaciones.completar).toHaveBeenCalledTimes(1);
  });
  it('oculta las acciones revocadas y nunca muestra cancelación ni precios editables', async () => {
    const s = orden(); s.es_propio = false; s.acciones_permitidas = {}; const f = crear(s); const c = f.componentInstance;
    c.abrirEjecucion('iniciar'); await c.guardarEjecucion(); expect(alert.create).not.toHaveBeenCalled();
    expect(f.nativeElement.textContent).not.toContain('Iniciar servicio'); expect(f.nativeElement.textContent).not.toContain('Completar servicio');
    expect(f.nativeElement.textContent).not.toContain('Cancelar servicio'); expect(f.nativeElement.querySelector('[name="costo_total"]')).toBeNull();
  });
  it('admite cierre sin materiales incluidos cuando el servidor lo permite', async () => {
    const s = enProceso(); s.materiales = []; const f = crear(s); cierre(f.componentInstance);
    await f.componentInstance.guardarEjecucion(); expect(operaciones.completar).toHaveBeenCalledTimes(1);
  });
  it('valida fechas inexistentes, fin igual al inicio y lectura inferior antes de confirmar', async () => {
    const f = crear(enProceso()); const c = f.componentInstance; cierre(c); c.fechaEjecucion = '2026-02-30T10:00';
    await c.guardarEjecucion(); expect(c.erroresEjecucion['fecha_fin']).toBeTruthy();
    c.fechaEjecucion = '2026-10-25T08:00'; await c.guardarEjecucion(); expect(c.erroresEjecucion['fecha_fin']).toContain('posterior');
    c.fechaEjecucion = '2026-10-25T10:00'; c.lecturaFinal = 99; await c.guardarEjecucion();
    expect(c.erroresEjecucion['horometro']).toBeTruthy(); expect(alert.create).not.toHaveBeenCalled();
  });
  it('solicita kilómetros enteros para vehículo y envía exclusivamente su lectura', async () => {
    const s = enProceso(); s.maquina_id = null; s.maquina = null; s.vehiculo_id = 7; s.vehiculo = { id: 7 }; s.km_actuales = 12000;
    const f = crear(s); const c = f.componentInstance; cierre(c); c.lecturaFinal = 12000.5; await c.guardarEjecucion();
    expect(c.erroresEjecucion['km_actuales']).toBeTruthy(); expect(operaciones.completar).not.toHaveBeenCalled();
    c.lecturaFinal = 12010; await c.guardarEjecucion();
    expect(operaciones.completar).toHaveBeenCalledOnceWith(17, { fecha_fin: '2026-10-25T10:00:00', km_actuales: 12010, notas: 'Realizado' });
  });
  it('conserva captura y presenta errores 422 por campo', async () => {
    const f = crear(enProceso()); const c = f.componentInstance; cierre(c);
    operaciones.completar.and.returnValue(throwError(() => ({ status: 422, error: { errors: { horometro: ['Menor al consolidado'], fecha_fin: ['Revisar fin'] } } })));
    await c.guardarEjecucion(); f.detectChanges(); expect(c.lecturaFinal).toBe(110); expect(c.notasEjecucion).toBe('Realizado');
    expect(f.nativeElement.textContent).toContain('Menor al consolidado'); expect(f.nativeElement.textContent).toContain('Revisar fin'); expect(c.ejecucionIncierta).toBeFalse();
  });
  it('relee acciones tras conflicto y conserva el mensaje del surtido', async () => {
    const f = crear(enProceso()); const c = f.componentInstance; cierre(c);
    consulta.detalle.and.returnValue(of({ ok: true, data: enProceso(false) }));
    operaciones.completar.and.returnValue(throwError(() => ({ status: 409, message: 'Falta surtido' })));
    await c.guardarEjecucion(); expect(consulta.detalle).toHaveBeenCalledWith('servicios', 17); expect(c.error).toBe('Falta surtido');
    expect(c.ejecucion).toBeNull(); c.abrirEjecucion('completar'); expect(c.ejecucion).toBeNull();
  });
  it('bloquea doble envío y evidencia durante el POST de ejecución', async () => {
    const f = crear(); const c = f.componentInstance; const pending = new Subject<any>(); operaciones.iniciar.and.returnValue(pending);
    c.abrirEjecucion('iniciar'); c.fechaEjecucion = '2026-10-25T08:00'; const first = c.guardarEjecucion(); await f.whenStable();
    await c.guardarEjecucion(); c.fotos = [{ archivo: new File(['x'], 'x.jpg', { type: 'image/jpeg' }), descripcion: '', preview: '' }];
    await c.subirFotos(); expect(operaciones.iniciar).toHaveBeenCalledTimes(1); expect(operaciones.evidencias).not.toHaveBeenCalled();
    pending.next({ ok: true, data: enProceso(false) }); await first;
  });
  it('permite volver de la confirmación conservando la captura', async () => {
    const f = crear(); const c = f.componentInstance; c.abrirEjecucion('iniciar'); c.fechaEjecucion = '2026-10-25T08:00';
    alert.create.and.resolveTo({ present: async () => undefined, onDidDismiss: async () => ({ role: 'cancel' }) });
    await c.guardarEjecucion(); expect(operaciones.iniciar).not.toHaveBeenCalled(); expect(c.fechaEjecucion).toBe('2026-10-25T08:00');
  });
  it('exige actualizar estado tras respuesta incierta y mantiene el bloqueo si falla la consulta', async () => {
    const f = crear(); const c = f.componentInstance; c.abrirEjecucion('iniciar'); c.fechaEjecucion = '2026-10-25T08:00';
    operaciones.iniciar.and.returnValue(throwError(() => ({ status: 0 })));
    await c.guardarEjecucion(); await c.guardarEjecucion(); expect(c.ejecucionIncierta).toBeTrue(); expect(operaciones.iniciar).toHaveBeenCalledTimes(1);
    consulta.detalle.and.returnValue(throwError(() => ({ status: 503 }))); await c.actualizarEjecucion(); expect(c.ejecucionIncierta).toBeTrue();
    consulta.detalle.and.returnValue(of({ ok: true, data: enProceso(false) })); await c.actualizarEjecucion();
    expect(c.ejecucionIncierta).toBeFalse(); expect(c.ejecucion).toBeNull(); expect(operaciones.iniciar).toHaveBeenCalledTimes(1);
  });
  it('cierra sesión ante 401 y revalida acceso ante 403', async () => {
    const f = crear(); const c = f.componentInstance; const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    c.abrirEjecucion('iniciar'); c.fechaEjecucion = '2026-10-25T08:00'; operaciones.iniciar.and.returnValue(throwError(() => ({ status: 401 })));
    await c.guardarEjecucion(); expect(auth.logout).toHaveBeenCalledTimes(1);
    operaciones.iniciar.and.returnValue(throwError(() => ({ status: 403 }))); await c.guardarEjecucion();
    expect(auth.getMe).toHaveBeenCalledTimes(1); expect(auth.setSelectedPanel).toHaveBeenCalledWith(null); expect(navegar).toHaveBeenCalledWith(['/home']);
  });
  it('revalida acción después de la confirmación y no envía al cambiar de servicio', async () => {
    const f = crear(); const c = f.componentInstance; const dismiss = new Subject<any>();
    alert.create.and.resolveTo({ present: async () => undefined, onDidDismiss: () => firstValueFrom(dismiss) });
    c.abrirEjecucion('iniciar'); c.fechaEjecucion = '2026-10-25T08:00'; const saving = c.guardarEjecucion(); await f.whenStable();
    f.componentRef.setInput('servicio', { ...orden(), id: 18 }); f.detectChanges(); dismiss.next({ role: 'confirm' }); await saving;
    expect(operaciones.iniciar).not.toHaveBeenCalled(); expect(c.ejecucion).toBeNull();
  });
  it('descarta la respuesta de ejecución si ya se muestra otro servicio', async () => {
    const f = crear(); const c = f.componentInstance; const pending = new Subject<any>(); operaciones.iniciar.and.returnValue(pending);
    const emit = spyOn(c.actualizado, 'emit'); c.abrirEjecucion('iniciar'); const saving = c.guardarEjecucion(); await f.whenStable();
    f.componentRef.setInput('servicio', { ...orden(), id: 18 }); f.detectChanges(); pending.next({ ok: true, data: enProceso() }); await saving;
    expect(c.servicio.id).toBe(18); expect(emit).not.toHaveBeenCalled();
  });
  it('no envía si se destruye la vista mientras se confirma', async () => {
    const f = crear(); const c = f.componentInstance; const dismiss = new Subject<any>();
    alert.create.and.resolveTo({ present: async () => undefined, onDidDismiss: () => firstValueFrom(dismiss) });
    c.abrirEjecucion('iniciar'); const saving = c.guardarEjecucion(); await f.whenStable(); f.destroy(); dismiss.next({ role: 'confirm' }); await saving;
    expect(operaciones.iniciar).not.toHaveBeenCalled();
  });
});

describe('Contrato HTTP de ejecución C13.5', () => {
  let http: HttpTestingController; let api: MecanicoOperacionService;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), ApiService, MecanicoOperacionService] });
    http = TestBed.inject(HttpTestingController); api = TestBed.inject(MecanicoOperacionService); });
  afterEach(() => http.verify());
  it('envía POST de inicio y cierre sin obra, precios ni actor', async () => {
    sessionStorage.setItem('selected_obra_id', '99');
    try {
      const p1 = firstValueFrom(api.iniciar(17, '2026-10-25T08:00:00'));
      const r1 = http.expectOne(r => r.url.endsWith('/mecanico/servicios/17/iniciar'));
      expect(r1.request.method).toBe('POST'); expect(r1.request.body).toEqual({ fecha_inicio: '2026-10-25T08:00:00' }); r1.flush({ ok: true, data: enProceso() }); await p1;
      const p2 = firstValueFrom(api.completar(17, { fecha_fin: '2026-10-25T10:00:00', km_actuales: 12010, notas: null }));
      const r2 = http.expectOne(r => r.url.endsWith('/mecanico/servicios/17/completar'));
      expect(r2.request.method).toBe('POST'); expect(r2.request.body).toEqual({ fecha_fin: '2026-10-25T10:00:00', km_actuales: 12010, notas: null }); r2.flush({ ok: true, data: terminado() }); await p2;
    } finally { sessionStorage.removeItem('selected_obra_id'); }
  });
  it('conserva la hora de México sin depender de la zona del teléfono y rechaza fechas inválidas', () => {
    expect(fechaMexico('2026-10-25T14:00:00Z')).toBe('2026-10-25T08:00');
    expect(fechaEjecucionMexico('2026-10-25T08:00')).toBe('2026-10-25T08:00:00');
    expect(fechaEjecucionMexico('2026-02-30T08:00')).toBeNull(); expect(fechaEjecucionMexico('2026-10-25T25:00')).toBeNull();
    expect(fechaMexico('fecha inválida')).toBe('');
  });
});
