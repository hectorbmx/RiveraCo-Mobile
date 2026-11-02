import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ToastController } from '@ionic/angular/standalone';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth';
import { ApiService } from '../services/api';
import { MecanicoConsultaService } from '../services/mecanico-consulta.service';
import { appShellGuard } from '../guards/app-shell.guard';
import { mecanicoGuard } from '../guards/mecanico.guard';
import { operativoPanelGuard } from '../guards/operativo-panel.guard';
import { SelectorPanelPage } from '../pages/selector-panel/selector-panel.page';

describe('Navegación mecánica', () => {
  let auth: any; let router: Router;
  beforeEach(() => {
    auth = {
      panelesDisponiblesValue: [{ key: 'mecanico', label: 'Mecánico' }], obrasResidenteValue: [],
      selectedPanelValue: null, selectedObraIdValue: 99,
      permisos: ['app.mecanico.access'], hasToken: () => true,
      hasPermission: (p: string) => auth.permisos.includes(p),
      setSelectedPanel: (p: string | null) => { auth.selectedPanelValue = p; },
      setSelectedObraId: (id: number | null) => { auth.selectedObraIdValue = id; },
      getMe: jasmine.createSpy('getMe').and.returnValue(of({ ok: true })), logout: jasmine.createSpy('logout'),
    };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth },
      { provide: ToastController, useValue: { create: async () => ({ present: async () => undefined }) } }] });
    router = TestBed.inject(Router);
  });
  const guard = (fn: any) => TestBed.runInInjectionContext(() => fn({} as any, { url: '/tabs-mecanico/servicios' } as any));
  it('abre el panel mecánico único sin obra', () => {
    expect(router.serializeUrl(guard(appShellGuard))).toBe('/tabs-mecanico/servicios');
    expect(auth.selectedObraIdValue).toBeNull();
  });
  it('conserva mecánico seleccionado entre varios paneles', () => {
    auth.panelesDisponiblesValue.push({ key: 'residente', label: 'Residente' }); auth.selectedPanelValue = 'mecanico';
    expect(router.serializeUrl(guard(appShellGuard))).toBe('/tabs-mecanico/servicios');
  });
  it('muestra selector cuando hay accesos múltiples sin selección', () => {
    auth.panelesDisponiblesValue.push({ key: 'gerencial', label: 'Gerencial' }); auth.permisos.push('app.gerencial.access');
    expect(router.serializeUrl(guard(appShellGuard))).toBe('/selector-panel');
  });
  it('preserva la entrada residente con obra única', () => {
    auth.panelesDisponiblesValue = [{ key: 'residente' }]; auth.permisos = []; auth.selectedObraIdValue = null;
    auth.obrasResidenteValue = [{ id: 9 }];
    expect(router.serializeUrl(guard(appShellGuard))).toBe('/tabs/tab1'); expect(auth.selectedObraIdValue).toBe(9);
  });
  it('revalida la sesión en servidor al entrar por una ruta directa', async () => {
    expect(await guard(mecanicoGuard)).toBeTrue(); expect(auth.getMe).toHaveBeenCalledTimes(1);
    expect(auth.selectedPanelValue).toBe('mecanico'); expect(auth.selectedObraIdValue).toBeNull();
  });
  it('rechaza un permiso revocado aunque la selección siga en caché', async () => {
    auth.selectedPanelValue = 'mecanico'; auth.permisos = []; auth.panelesDisponiblesValue = [{ key: 'residente' }];
    expect(router.serializeUrl(await guard(mecanicoGuard))).toBe('/home'); expect(auth.selectedPanelValue).toBeNull();
  });
  it('limpia la sesión expirada', async () => {
    auth.getMe.and.returnValue(throwError(() => ({ status: 401 })));
    expect(router.serializeUrl(await guard(mecanicoGuard))).toBe('/login'); expect(auth.logout).toHaveBeenCalled();
  });
  it('no abre el panel residente a un mecánico exclusivo', () => {
    expect(router.serializeUrl(guard(operativoPanelGuard))).toBe('/home');
  });
  it('el selector reconoce mecánico sin pedir obra', async () => {
    const navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    const page = new SelectorPanelPage(auth, { navigate } as any, {} as any);
    page.paneles = auth.panelesDisponiblesValue;
    await page.choosePanel('mecanico');
    expect(navigate).toHaveBeenCalledWith(['/tabs-mecanico', 'servicios']); expect(auth.selectedObraIdValue).toBeNull();
  });
});

describe('Transporte mecánico', () => {
  let http: HttpTestingController; let service: MecanicoConsultaService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), ApiService, MecanicoConsultaService] });
    http = TestBed.inject(HttpTestingController); service = TestBed.inject(MecanicoConsultaService);
    sessionStorage.setItem('selected_obra_id', '99');
  });
  afterEach(() => { http.verify(); sessionStorage.removeItem('selected_obra_id'); });
  it('usa la familia mecánica sin inyectar una obra residente', async () => {
    const promise = firstValueFrom(service.listado('maquinas', { page: 2, q: 'Equipo' }));
    const req = http.expectOne(r => r.url.endsWith('/api/v1/mecanico/maquinas'));
    expect(req.request.params.has('obra_id')).toBeFalse(); expect(req.request.params.get('page')).toBe('2');
    req.flush({ ok: true, data: [], meta: { current_page: 2, last_page: 2, total: 0, per_page: 25 } });
    expect((await promise).data).toEqual([]);
  });
  it('conserva status y validaciones Laravel para el módulo', async () => {
    const promise = firstValueFrom(service.listado('servicios', {})).catch(error => error);
    http.expectOne(r => r.url.endsWith('/api/v1/mecanico/servicios')).flush(
      { message: 'Filtro inválido', errors: { estatus: ['No válido'] } }, { status: 422, statusText: 'Unprocessable Entity' });
    const error = await promise;
    expect(error.status).toBe(422); expect(error.message).toBe('Filtro inválido'); expect(error.error.errors.estatus).toEqual(['No válido']);
  });
});
