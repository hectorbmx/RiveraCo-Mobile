import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api';
import { CapturaHorasMaquina, MecanicoMaquinaHorasService } from './mecanico-maquina-horas.service';

describe('Contrato de transporte y recuperación de horas', () => {
  let api: MecanicoMaquinaHorasService; let http: HttpTestingController;
  const payload: CapturaHorasMaquina = { asignacion_esperada_id: null, horometro_esperado: null,
    horometro_fin: 10, fecha_registro: '2026-10-29', obra_id: null, notas: null };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), ApiService, MecanicoMaquinaHorasService] });
    api = TestBed.inject(MecanicoMaquinaHorasService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); for (const user of [9080, 9090]) api.olvidar(user, 17); });
  it('consulta opciones/obras y envía payload con contexto nulo intacto al endpoint mecánico', () => {
    api.opciones(17, { uso: 'ajuste', q: 'Obra', page: 2 }).subscribe();
    const opciones = http.expectOne(r => r.url.endsWith('/mecanico/maquinas/17/opciones-operacion'));
    expect(opciones.request.params.get('uso')).toBe('ajuste'); expect(opciones.request.params.get('page')).toBe('2');
    opciones.flush({ ok: true, data: {} });
    api.guardar(17, payload).subscribe(); const envio = http.expectOne(r => r.url.endsWith('/mecanico/maquinas/17/horas'));
    expect(envio.request.method).toBe('POST'); expect(envio.request.body).toEqual(payload); expect(envio.request.headers.get('Accept')).toBe('application/json');
    envio.flush({ ok: true, data: {} });
  });
  it('recupera el payload de la sesión tras recrear el servicio, aislado por usuario y máquina', () => {
    api.recordar(9080, 17, payload);
    const nueva = new MecanicoMaquinaHorasService(TestBed.inject(ApiService));
    expect(nueva.pendiente(9080, 17)).toEqual(payload); expect(nueva.pendiente(9090, 17)).toBeNull(); expect(nueva.pendiente(9080, 18)).toBeNull();
    const copia = nueva.pendiente(9080, 17)!; copia.horometro_fin = 999;
    expect(nueva.pendiente(9080, 17)?.horometro_fin).toBe(10);
    nueva.olvidar(9080, 17); expect(nueva.pendiente(9080, 17)).toBeNull();
  });
  it('ignora almacenamiento corrupto y conserva errores Laravel por campo', () => {
    sessionStorage.setItem('mecanico.horas.pendiente.v1.9080.17', '{malformado'); expect(api.pendiente(9080, 17)).toBeNull();
    let error: any; api.guardar(17, payload).subscribe({ error: e => error = e });
    http.expectOne(r => r.url.endsWith('/mecanico/maquinas/17/horas')).flush({ message: 'Captura inválida', errors: { horometro_fin: ['Debe ser mayor'] } }, { status: 422, statusText: 'Unprocessable Content' });
    expect(error.status).toBe(422); expect(error.error.errors.horometro_fin).toEqual(['Debe ser mayor']);
  });
});
