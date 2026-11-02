import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { CapturaHorasMaquina, fechaHoraMaquinaMexico, MecanicoMaquinaHorasService, OpcionesHorasMaquina, ResultadoHorasMaquina } from '../services/mecanico-maquina-horas.service';
import { MecanicoMaquinaHorasComponent } from './mecanico-maquina-horas.component';

describe('Modal de horas de máquina', () => {
  let fixture: ComponentFixture<MecanicoMaquinaHorasComponent>; let page: MecanicoMaquinaHorasComponent;
  let api: any; let auth: any; let pendientes: Map<string, CapturaHorasMaquina>;
  const datos = (registro = false, id = 17): OpcionesHorasMaquina => ({
    maquina: { id, nombre: 'GRÚA MANITEX', codigo: 'M-17', horometro_actual: 100 },
    asignacion_activa: registro ? { obra_maquina_id: 81, fecha_inicio: '2026-10-01', estado: 'activa', horometro_inicio: 100, obra: { id: 9, nombre: 'Obra activa' } } : null,
    contexto: { asignacion_esperada_id: registro ? 81 : null, horometro_esperado: 100 },
    acciones_permitidas: { registrar_horas: registro, ajustar_horometro: !registro, asignar_obra: false, retirar_obra: false, cambiar_ubicacion: false },
  });
  const resultado = (registro = false): ResultadoHorasMaquina => ({ ...datos(registro),
    maquina: { ...datos(registro).maquina, horometro_actual: 120 },
    operacion: { tipo: registro ? 'registro_horas' : 'ajuste_horometro', id: 3, asignacion_id: registro ? 81 : null,
      horometro_anterior: 100, horometro_nuevo: 120, diferencia: 20, reutilizada: false },
  });
  beforeEach(async () => {
    pendientes = new Map();
    api = { opciones: jasmine.createSpy('opciones').and.returnValue(of({ ok: true, data: datos() })),
      guardar: jasmine.createSpy('guardar').and.returnValue(of({ ok: true, data: resultado() })),
      pendiente: (u: number, m: number) => pendientes.get(`${u}.${m}`) ?? null,
      recordar: (u: number, m: number, p: CapturaHorasMaquina) => pendientes.set(`${u}.${m}`, { ...p }),
      olvidar: (u: number, m: number) => pendientes.delete(`${u}.${m}`) };
    auth = { currentUserValue: { id: 80 }, logout: jasmine.createSpy('logout') };
    await TestBed.configureTestingModule({ imports: [MecanicoMaquinaHorasComponent], providers: [provideIonicAngular({ animated: false }),
      { provide: MecanicoMaquinaHorasService, useValue: api }, { provide: AuthService, useValue: auth }] }).compileComponents();
    fixture = TestBed.createComponent(MecanicoMaquinaHorasComponent); page = fixture.componentInstance;
  });
  afterEach(async () => {
    page.guardando = false;
    const modal = document.querySelector('ion-modal'); if (modal) await modal.dismiss();
    fixture.destroy();
  });
  async function abrir(registro = false) {
    api.opciones.and.returnValue(of({ ok: true, data: datos(registro) }));
    fixture.componentRef.setInput('maquinaId', 17); fixture.detectChanges();
    await fixture.whenStable(); fixture.detectChanges();
    const modal = document.querySelector('ion-modal') as HTMLIonModalElement;
    await modal.present();
    return modal;
  }
  it('presenta máquina, referencia y campos de ajuste sin asignación', async () => {
    const modal = await abrir();
    expect(modal.textContent).toContain('GRÚA MANITEX'); expect(modal.textContent).toContain('Sin obra asignada');
    expect(modal.querySelector('input[name="fecha_registro"]')).not.toBeNull();
    expect(modal.querySelector('input[name="inicio"]')).toBeNull();
    expect(modal.textContent).toContain('Obra relacionada'); expect(page.titulo).toBe('Ajustar horómetro');
  });
  it('elige registro según contexto del servidor y no permite seleccionar otra obra', async () => {
    const modal = await abrir(true);
    expect(page.titulo).toBe('Registrar horas de máquina'); expect(modal.textContent).toContain('Obra activa');
    expect(modal.querySelector('input[name="inicio"]')).not.toBeNull();
    expect(modal.querySelector('input[name="fin"]')).not.toBeNull(); expect(modal.querySelector('ion-select')).toBeNull();
    page.lecturaNueva = 120; page.inicio = '2026-10-29T08:00'; page.fin = '2026-10-29T10:00';
    await page.guardar();
    expect(api.guardar.calls.mostRecent().args).toEqual([17, { asignacion_esperada_id: 81, horometro_esperado: 100,
      horometro_fin: 120, inicio: '2026-10-29T08:00:00-06:00', fin: '2026-10-29T10:00:00-06:00', notas: null }]);
  });
  it('envía un ajuste con fecha civil, obra opcional y contexto original sin campos de registro', async () => {
    await abrir(); const emit = spyOn(page.guardado, 'emit');
    page.lecturaNueva = 120; page.fechaRegistro = '2026-10-29'; page.notas = '  Contador verificado  ';
    await page.guardar();
    expect(api.guardar.calls.mostRecent().args).toEqual([17, { asignacion_esperada_id: null, horometro_esperado: 100,
      horometro_fin: 120, fecha_registro: '2026-10-29', obra_id: null, notas: 'Contador verificado' }]);
    expect(emit).toHaveBeenCalledWith(resultado()); expect(pendientes.size).toBe(0);
  });
  it('valida lectura, precisión, fecha imposible y notas antes del envío; cero de referencia es válido', async () => {
    await abrir();
    for (const lectura of [null, '', 100, 99, 100.001, 100000000, 'INF']) {
      page.lecturaNueva = lectura; await page.guardar(); expect(page.errores['horometro_fin']).toBeTruthy();
    }
    page.lecturaNueva = 120; page.fechaRegistro = '2026-02-30'; await page.guardar(); expect(page.errores['fecha_registro']).toBeTruthy();
    page.fechaRegistro = '2026-10-29'; page.notas = 'x'.repeat(501); await page.guardar(); expect(page.errores['notas']).toBeTruthy();
    expect(api.guardar).not.toHaveBeenCalled();
    page.opciones!.contexto.horometro_esperado = 0; page.lecturaNueva = 0.01; page.notas = ''; await page.guardar();
    expect(api.guardar.calls.mostRecent().args[1].horometro_esperado).toBe(0);
  });
  it('rechaza fin anterior e inicio inválido sin enviar', async () => {
    await abrir(true); page.lecturaNueva = 120; page.inicio = '2026-10-29T10:00'; page.fin = '2026-10-29T09:00';
    await page.guardar(); expect(page.errores['fin']).toBeTruthy();
    page.inicio = '2026-02-30T08:00'; await page.guardar(); expect(page.errores['inicio']).toBeTruthy();
    expect(api.guardar).not.toHaveBeenCalled();
  });
  it('respeta capacidades y no envía cuando el servidor no habilita la operación', async () => {
    await abrir(); page.opciones!.acciones_permitidas.ajustar_horometro = false;
    fixture.detectChanges(); page.lecturaNueva = 120; await page.guardar(); expect(api.guardar).not.toHaveBeenCalled();
    expect(page.permite).toBeFalse();
  });
  it('bloquea doble envío y cierre mientras guarda', async () => {
    await abrir(); const envio = new Subject<any>(); api.guardar.and.returnValue(envio);
    page.lecturaNueva = 120; const primero = page.guardar(); await page.guardar();
    expect(api.guardar).toHaveBeenCalledTimes(1); expect(await page.puedeCerrar()).toBeFalse();
    envio.next({ ok: true, data: resultado() }); envio.complete(); await primero;
    expect(await page.puedeCerrar()).toBeTrue();
  });
  it('un resultado incierto congela el payload y reintenta exactamente la misma captura', async () => {
    await abrir(); page.lecturaNueva = 120; page.fechaRegistro = '2026-10-29';
    api.guardar.and.returnValue(throwError(() => ({ status: 0 })));
    await page.guardar(); const original = api.guardar.calls.mostRecent().args[1];
    expect(page.incierto).toBeTrue(); expect(pendientes.size).toBe(1);
    page.lecturaNueva = 999; page.notas = 'No debe cambiar'; page.fechaRegistro = '2026-10-30';
    await page.guardar(); expect(api.guardar).toHaveBeenCalledTimes(1);
    api.guardar.and.returnValue(of({ ok: true, data: { ...resultado(), operacion: { ...resultado().operacion, reutilizada: true } } }));
    await page.guardar(true); expect(api.guardar.calls.mostRecent().args[1]).toEqual(original);
    expect(page.incierto).toBeFalse(); expect(pendientes.size).toBe(0);
  });
  it('recupera la captura pendiente al cerrar y reabrir sin reemplazar referencia ni fechas', async () => {
    await abrir(); page.lecturaNueva = 120; page.fechaRegistro = '2026-10-28';
    api.guardar.and.returnValue(throwError(() => ({ status: 500 }))); await page.guardar();
    fixture.componentRef.setInput('maquinaId', null); fixture.detectChanges(); await fixture.whenStable();
    const actuales = datos(); actuales.contexto.horometro_esperado = 120;
    api.opciones.and.returnValue(of({ ok: true, data: actuales }));
    fixture.componentRef.setInput('maquinaId', 17); fixture.detectChanges(); await fixture.whenStable();
    expect(page.incierto).toBeTrue(); expect(page.referencia).toBe(100); expect(page.fechaRegistro).toBe('2026-10-28');
    expect(page.lecturaNueva).toBe(120);
  });
  it('409 requiere revisar contexto antes de permitir otra captura y 422 presenta errores por campo', async () => {
    await abrir(); page.lecturaNueva = 120;
    api.guardar.and.returnValue(throwError(() => ({ status: 409, message: 'La asignación cambió' })));
    await page.guardar(); expect(page.contextoCambiado).toBeTrue(); expect(pendientes.size).toBe(0);
    await page.guardar(); expect(api.guardar).toHaveBeenCalledTimes(1);
    const actuales = datos(); actuales.contexto.horometro_esperado = 110;
    api.opciones.and.returnValue(of({ ok: true, data: actuales })); await page.cargarOpciones(true);
    expect(page.lecturaNueva).toBe(120); expect(page.referencia).toBe(110); expect(page.contextoCambiado).toBeFalse();
    api.guardar.and.returnValue(throwError(() => ({ status: 422, error: { errors: { fecha_registro: ['Fecha anterior a la lectura válida'] } } })));
    await page.guardar(); expect(page.errores['fecha_registro']).toContain('Fecha anterior'); expect(page.incierto).toBeFalse();
  });
  it('busca y pagina obras sin cambiar el contexto y conserva la selección fuera de la página', async () => {
    await abrir(); const paginas = { ...datos(), obras: [{ id: 9, nombre: 'Obra elegida' }] };
    paginas.contexto.horometro_esperado = 130;
    api.opciones.and.returnValue(of({ ok: true, data: paginas, meta: { current_page: 1, last_page: 2, total: 21, per_page: 20 } }));
    page.busquedaObra = 'Obra'; await page.buscarObras(); page.obraId = 9; page.seleccionarObra();
    expect(page.referencia).toBe(100);
    api.opciones.and.returnValue(of({ ok: true, data: { ...datos(), obras: [{ id: 10, nombre: 'Otra obra' }] }, meta: { current_page: 2, last_page: 2, total: 21, per_page: 20 } }));
    await page.buscarObras(2); expect(page.obraFueraPagina).toBeTrue(); expect(page.obraSeleccionada?.nombre).toBe('Obra elegida');
    expect(api.opciones.calls.mostRecent().args).toEqual([17, { uso: 'ajuste', q: 'Obra', page: 2 }]);
    page.lecturaNueva = 120; await page.guardar(); expect(api.guardar.calls.mostRecent().args[1].obra_id).toBe(9);
  });
  it('ignora respuestas de otra máquina y no envía con otra sesión', async () => {
    const primera = new Subject<any>(); const segunda = new Subject<any>();
    api.opciones.and.returnValues(primera, segunda);
    fixture.componentRef.setInput('maquinaId', 17); fixture.detectChanges();
    fixture.componentRef.setInput('maquinaId', 18); fixture.detectChanges();
    primera.next({ ok: true, data: datos(false, 17) }); primera.complete(); segunda.next({ ok: true, data: datos(false, 18) }); segunda.complete();
    await fixture.whenStable(); expect(page.opciones?.maquina.id).toBe(18);
    auth.currentUserValue = { id: 90 }; page.lecturaNueva = 120; await page.guardar();
    expect(api.guardar).not.toHaveBeenCalled(); expect(page.accesoDenegado).toBeTrue();
  });
  it('actualizar el contexto descarta búsquedas antiguas sin dejar el selector bloqueado', async () => {
    await abrir(); const antigua = new Subject<any>(); api.opciones.and.returnValue(antigua);
    const busqueda = page.buscarObras(); expect(page.cargandoObras).toBeTrue();
    api.opciones.and.returnValue(of({ ok: true, data: datos() })); await page.cargarOpciones(true);
    expect(page.cargandoObras).toBeFalse();
    antigua.next({ ok: true, data: { ...datos(), obras: [{ id: 9, nombre: 'Resultado antiguo' }] } }); antigua.complete(); await busqueda;
    expect(page.obras).toEqual([]);
  });
  it('una respuesta de guardado de la sesión anterior no actualiza la pantalla de otro usuario', async () => {
    await abrir(); const envio = new Subject<any>(); api.guardar.and.returnValue(envio); const emit = spyOn(page.guardado, 'emit');
    page.lecturaNueva = 120; const guardar = page.guardar(); auth.currentUserValue = { id: 90 };
    envio.next({ ok: true, data: resultado() }); envio.complete(); await guardar;
    expect(emit).not.toHaveBeenCalled(); expect(pendientes.size).toBe(0);
  });
  it('401 cierra sesión y 403 conserva la captura sin permitir más envíos', async () => {
    await abrir(); page.lecturaNueva = 120;
    api.guardar.and.returnValue(throwError(() => ({ status: 403 }))); await page.guardar();
    expect(page.accesoDenegado).toBeTrue(); expect(pendientes.size).toBe(1); await page.guardar(true);
    expect(api.guardar).toHaveBeenCalledTimes(1);
    page.accesoDenegado = false; api.guardar.and.returnValue(throwError(() => ({ status: 401 }))); await page.guardar(true);
    expect(auth.logout).toHaveBeenCalled();
  });
  it('convierte hora civil a México con offset y rechaza fechas imposibles', () => {
    expect(fechaHoraMaquinaMexico('2026-10-29T08:00')).toBe('2026-10-29T08:00:00-06:00');
    expect(fechaHoraMaquinaMexico('2021-07-01T08:00')).toBe('2021-07-01T08:00:00-05:00');
    expect(fechaHoraMaquinaMexico('2026-02-30T08:00')).toBeNull();
  });
});
