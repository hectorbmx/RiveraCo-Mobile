import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { FilaMecanico, PreventivoMaquina, ResumenPreventivoMaquina } from '../services/mecanico-consulta.service';
import { MecanicoMaquinaCardComponent } from './mecanico-maquina-card.component';

describe('Tarjeta operativa de máquina', () => {
  let fixture: ComponentFixture<MecanicoMaquinaCardComponent>;
  const general = (): PreventivoMaquina => ({ servicio_id: 1, servicio_nombre: 'General', estado: 'proximo',
    label: 'Próximo: restan 20 h', color: 'amber', horas_usadas: 480, horas_restantes: 20,
    intervalo_horas: 500, porcentaje: 96, proximo_horometro: 1500, proximo_fecha: '2027-04-01' });
  const resumen = (): ResumenPreventivoMaquina => ({ ...general(), horometro_actual: 1480,
    servicios: [general(), { ...general(), servicio_id: 2, servicio_nombre: 'Mayor', intervalo_horas: 1000,
      estado: 'ok', label: 'Restan 520 h', horas_restantes: 520, proximo_horometro: 2000 }] });
  const maquina = (): FilaMecanico => ({ id: 17, codigo: 'M-17', nombre: 'GRÚA MANITEX', marca: 'MANITEX',
    modelo: '35124C', estado: 'operativa', ubicacion: 'en_obra', obra_activa: { id: 9, nombre: 'Obra Giralda' },
    horometro_base: 100, horometro_actual: 1480, fecha_ultima_lectura: '2026-10-28T10:00:00-06:00', preventivo: resumen() });
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MecanicoMaquinaCardComponent],
      providers: [provideIonicAngular(), provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(MecanicoMaquinaCardComponent);
    fixture.componentRef.setInput('maquina', maquina());
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
  });
  function texto() { return fixture.nativeElement.textContent as string; }
  function enlaces() {
    return fixture.debugElement.queryAll(By.directive(RouterLink))
      .map(el => TestBed.inject(Router).serializeUrl(el.injector.get(RouterLink).urlTree!));
  }
  it('presenta identidad, obra, ubicación, lectura actual y preventivo recibido sin recalcularlo', () => {
    expect(fixture.nativeElement.querySelector('h2').textContent).toBe('GRÚA MANITEX');
    for (const dato of ['M-17', 'Operativa', 'En obra', 'Obra Giralda', 'General', 'Próximo: restan 20 h', '28/10/2026', '01/04/2027']) expect(texto()).toContain(dato);
    expect(fixture.nativeElement.querySelector('.horometro').textContent).toContain('1,480');
    expect(texto()).not.toContain('Horómetro base');
    expect(fixture.nativeElement.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('96');
  });
  it('despliega todos los tipos sin navegar ni repetir acciones dentro del desplegable', () => {
    const panel = fixture.nativeElement.querySelector('details') as HTMLDetailsElement;
    expect(panel.open).toBeFalse(); panel.querySelector('summary')!.click();
    expect(panel.open).toBeTrue(); expect(panel.querySelectorAll('.preventivo-tipo').length).toBe(2);
    expect(panel.textContent).toContain('Mayor'); expect(panel.textContent).toContain('Cada');
    expect(panel.querySelector('ion-button')).toBeNull(); panel.querySelector('summary')!.click(); expect(panel.open).toBeFalse();
  });
  it('conserva cero como lectura válida y muestra ausencia de obra, fecha y preventivo explícitamente', () => {
    fixture.componentRef.setInput('maquina', { id: 17, nombre: 'Equipo', horometro_base: 999, horometro_actual: 0 }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.horometro').textContent).toContain('0');
    for (const dato of ['Sin obra asignada', 'Sin fecha registrada', 'Sin ubicación', 'Información preventiva no disponible']) expect(texto()).toContain(dato);
    expect(fixture.nativeElement.querySelector('.progreso')).toBeNull();
    fixture.componentRef.setInput('maquina', { id: 17, horometro_base: 999, horometro_actual: null }); fixture.detectChanges();
    expect(texto()).toContain('Sin lectura disponible'); expect(texto()).not.toContain('999');
  });
  it('omite la barra sin datos y acota únicamente el ancho visual del porcentaje', () => {
    const dato = maquina(); dato.preventivo = { ...resumen(), estado: 'sin_datos' }; fixture.componentRef.setInput('maquina', dato); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeNull();
    dato.preventivo = { ...resumen(), estado: 'vencido', porcentaje: 130 }; fixture.componentRef.setInput('maquina', { ...dato }); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('100');
    expect(fixture.nativeElement.querySelector('.preventivo > .preventivo-titulo').textContent).toContain('Vencido');
  });
  it('enlaza detalle y programación para una sola máquina y respeta empleado y modo detalle', () => {
    expect(enlaces()).toEqual(['/tabs-mecanico/maquinas/17']);
    fixture.componentRef.setInput('puedeProgramar', true); fixture.detectChanges();
    expect(enlaces()).toEqual(['/tabs-mecanico/maquinas/17', '/tabs-mecanico/servicios/nuevo?maquina_id=17']);
    fixture.componentRef.setInput('detalle', true); fixture.detectChanges();
    expect(enlaces()).toEqual(['/tabs-mecanico/servicios/nuevo?maquina_id=17']);
    fixture.componentRef.setInput('puedeProgramar', false); fixture.detectChanges(); expect(enlaces()).toEqual([]);
  });
  it('muestra la acción de horas solo con permiso y emite una única máquina', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Ajustar horómetro');
    fixture.componentRef.setInput('puedeCapturarHoras', true); fixture.detectChanges();
    const emit = spyOn(fixture.componentInstance.capturarHoras, 'emit');
    const boton = Array.from(fixture.nativeElement.querySelectorAll('ion-button')).find((el: any) => el.textContent.includes('Registrar horas')) as HTMLElement;
    expect(boton).toBeTruthy(); boton.click(); expect(emit).toHaveBeenCalledWith(17);
    fixture.componentRef.setInput('maquina', { id: 17 }); fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain('Ajustar horómetro');
  });
  it('formatea la meta por fecha civil sin convertirla a otra zona', () => {
    expect(fixture.componentInstance.fechaCivil('2027-04-01')).toBe('01/04/2027');
  });
});
