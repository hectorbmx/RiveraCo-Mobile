import { By } from '@angular/platform-browser';
import { MecanicoMaquinaHorasComponent } from './mecanico-maquina-horas.component';
import { MecanicoMaquinaHorasService } from '../services/mecanico-maquina-horas.service';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { of, Subject, throwError } from 'rxjs';
import { MecanicoConsultaPage } from './mecanico-consulta.page';
import { MecanicoConsultaService, ListaMecanico } from '../services/mecanico-consulta.service';
import { AuthService } from '../services/auth';
import { MecanicoOperacionService } from '../services/mecanico-operacion.service';
import { MecanicoFotoService } from '../services/mecanico-foto.service';

describe('Consultas mecánicas renderizadas', () => {
  let consulta: any; let auth: any; let harness: RouterTestingHarness;
  const lista = (nombre = 'Cambio de aceite'): ListaMecanico => ({ ok: true,
    data: [{ id: 17, categoria_mantenimiento: nombre, servicio_preventivo: { id: 3, nombre, intervalo_valor: 500, unidad: 'horas' }, estatus: 'orden_generada', fecha_programada: '2026-10-25T09:00:00Z', maquina: { id: 4, nombre: 'Perforadora' } }],
    meta: { current_page: 1, last_page: 2, total: 26, per_page: 25 } });
  const detalle = () => ({ ok: true, data: {
    id: 17, estatus: 'pendiente', categoria_mantenimiento: 'Preventivo', descripcion: 'Inspección general', costo_total: 1250,
    maquina: { id: 4, nombre: 'Perforadora' }, mecanico: { id: 11, nombre: 'Juan Pérez' },
    orden: { folio: 'OSM-26-000017', generada_at: '2026-10-25T09:00:00Z' },
    materiales: [{ id: 8, producto_id: 5, material_preventivo_id: 1, producto: 'Filtro principal', cantidad_requerida: 1, unidad: 'PZA', incluido: false, motivo_exclusion: 'No requiere reemplazo' }, { id: 9, producto_id: 6, material_preventivo_id: 2, producto: 'Aceite', cantidad_requerida: 10, unidad: 'L', incluido: true, motivo_exclusion: null }],
    avance_materiales: [{ producto_id: 6, material_preventivo_id: 2, producto: 'Aceite', requerido: 10, surtido: 4, faltante: 6, disponible: 5, estado: 'parcial' }],
    solicitudes: [{ id: 9, folio: 'SMA-26-000009', tipo: 'almacen', estado: 'parcial',
      documentos_inventario: [{ id: 4, folio: 'SAL-004', estado: 'aplicado' }], ordenes_compra: [{ id: 2, folio: 'OC-002', estado: 'AUTORIZADA' }] }],
    evidencias: [{ id: 1, descripcion: 'Motor revisado', url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' }], acciones_permitidas: {},
  } });
  beforeEach(async () => {
    consulta = { listado: jasmine.createSpy('listado').and.returnValue(of(lista())), detalle: jasmine.createSpy('detalle').and.returnValue(of(detalle())) };
    auth = { currentUserValue: { id: 80 }, hasPermission: jasmine.createSpy('hasPermission').and.returnValue(false), panelesDisponiblesValue: [{ key: 'mecanico' }], logout: jasmine.createSpy('logout'),
      getMe: jasmine.createSpy('getMe').and.returnValue(of({ ok: true })), setSelectedPanel: jasmine.createSpy('setSelectedPanel') };
    TestBed.configureTestingModule({ imports: [MecanicoConsultaPage], providers: [provideIonicAngular(), provideRouter([
      { path: 'servicios', component: MecanicoConsultaPage, data: { recurso: 'servicios' } },
      { path: 'servicios/:id', component: MecanicoConsultaPage, data: { recurso: 'servicios' } },
      { path: 'maquinas', component: MecanicoConsultaPage, data: { recurso: 'maquinas' } },
      { path: 'maquinas/:id', component: MecanicoConsultaPage, data: { recurso: 'maquinas' } },
      { path: 'vehiculos/:id', component: MecanicoConsultaPage, data: { recurso: 'vehiculos' } },
    ]), { provide: MecanicoMaquinaHorasService, useValue: {
      pendiente: () => null, opciones: () => of({ ok: true, data: { maquina: { id: 4, nombre: 'Grúa', horometro_actual: 100 },
        contexto: { asignacion_esperada_id: null, horometro_esperado: 100 }, asignacion_activa: null,
        acciones_permitidas: { registrar_horas: false, ajustar_horometro: true } } }) } },
      { provide: MecanicoConsultaService, useValue: consulta }, { provide: AuthService, useValue: auth }, { provide: MecanicoOperacionService, useValue: {} }, { provide: MecanicoFotoService, useValue: {} }] });
    harness = await RouterTestingHarness.create();
  });
  async function abrir(url = '/servicios') {
    const page = await harness.navigateByUrl(url, MecanicoConsultaPage);
    await harness.fixture.whenStable(); harness.detectChanges();
    return page;
  }
  async function render() { await harness.fixture.whenStable(); harness.detectChanges(); }
  function texto() { return harness.routeNativeElement?.textContent || ''; }

  it('usa tarjetas de máquinas y conserva búsqueda y paginación sin filtros de servicios', async () => {
    consulta.listado.and.returnValue(of({ ok: true, data: [{ id: 4, nombre: 'Grúa', ubicacion: 'en_patio', horometro_actual: 0 }],
      meta: { current_page: 1, last_page: 2, total: 21, per_page: 20 } }));
    const page = await abrir('/maquinas');
    expect(harness.routeNativeElement!.querySelectorAll('app-mecanico-maquina-card').length).toBe(1);
    expect(texto()).toContain('Horómetro actual'); expect(texto()).toContain('En patio');
    expect(harness.routeNativeElement!.querySelector('ion-list')).toBeNull();
    page.busqueda = 'Grúa'; await page.cargar(2);
    expect(consulta.listado.calls.mostRecent().args).toEqual(['maquinas', { page: 2, q: 'Grúa' }]);
  });
  it('presenta la obra activa del detalle de máquina dentro de la tarjeta y conserva el historial', async () => {
    consulta.detalle.and.returnValue(of({ ok: true, data: { maquina: { id: 4, nombre: 'Grúa', horometro_actual: 1480 },
      asignacion_activa: { obra_maquina_id: 2, estado: 'activa', obra: { id: 9, nombre: 'Obra asignada' } },
      mantenimientos_recientes: [{ id: 17, tipo: 'programado', descripcion: 'Último servicio' }] } }));
    await abrir('/maquinas/4');
    expect(texto()).toContain('Obra asignada'); expect(texto()).toContain('Último servicio');
    expect(harness.routeNativeElement!.querySelectorAll('app-mecanico-maquina-card').length).toBe(1);
    expect(harness.routeNativeElement!.querySelector('app-mecanico-maquina-card')!.textContent).not.toContain('Ver detalle');
  });
  it('abre horas desde las tarjetas y actualiza solo la máquina sin perder búsqueda ni página', async () => {
    auth.hasPermission.and.returnValue(true);
    consulta.listado.and.returnValue(of({ ok: true, data: [{ id: 4, nombre: 'Grúa', horometro_actual: 100 }],
      meta: { current_page: 2, last_page: 2, total: 21, per_page: 20 } }));
    const page = await abrir('/maquinas'); page.busqueda = 'Grúa'; page.abrirHoras(4); await render();
    const modal = harness.fixture.debugElement.query(By.directive(MecanicoMaquinaHorasComponent)).componentInstance as MecanicoMaquinaHorasComponent;
    modal.guardado.emit({ maquina: { id: 4, nombre: 'Grúa', horometro_actual: 120 }, asignacion_activa: null,
      contexto: { asignacion_esperada_id: null, horometro_esperado: 120 },
      acciones_permitidas: { registrar_horas: false, ajustar_horometro: true, asignar_obra: false, retirar_obra: false, cambiar_ubicacion: false },
      operacion: { id: 2, tipo: 'ajuste_horometro', asignacion_id: null, horometro_anterior: 100, horometro_nuevo: 120, diferencia: 20, reutilizada: false } });
    await render(); expect(page.filas[0].horometro_actual).toBe(120); expect(page.busqueda).toBe('Grúa');
    expect(page.meta?.current_page).toBe(2); expect(page.maquinaHorasId).toBeNull(); expect(consulta.listado).toHaveBeenCalledTimes(1);
    expect(texto()).toContain('Horómetro ajustado correctamente.');
  });
  it('sin permiso no abre la captura y el resultado actualiza también el detalle', async () => {
    consulta.detalle.and.returnValue(of({ ok: true, data: { maquina: { id: 4, nombre: 'Grúa', horometro_actual: 100 }, mantenimientos_recientes: [] } }));
    const page = await abrir('/maquinas/4'); page.abrirHoras(4); expect(page.maquinaHorasId).toBeNull();
    page.aplicarHoras({ maquina: { id: 4, horometro_actual: 125 }, asignacion_activa: null, contexto: { asignacion_esperada_id: null, horometro_esperado: 125 },
      acciones_permitidas: { registrar_horas: false, ajustar_horometro: true, asignar_obra: false, retirar_obra: false, cambiar_ubicacion: false },
      operacion: { id: 1, tipo: 'ajuste_horometro', asignacion_id: null, horometro_anterior: 100, horometro_nuevo: 125, diferencia: 25, reutilizada: true } });
    expect(page.equipo?.horometro_actual).toBe(125); expect(page.avisoHoras).toContain('Captura confirmada');
  });
  it('renderiza la lista paginada, equipo y estado sin componentes administrativos', async () => {
    await abrir();
    expect(texto()).toContain('Cambio de aceite'); expect(texto()).toContain('Perforadora');
    expect(texto()).toContain('orden generada'); expect(texto()).toContain('26 resultados');
    expect(harness.routeNativeElement?.querySelectorAll('ion-item').length).toBe(1);
    expect(texto()).not.toContain('Gerencial');
  });
  it('envía filtros de fechas, estado, propios y un solo equipo al cambiar de página', async () => {
    const page = await abrir();
    page.fechaDesde = '2026-10-01'; page.fechaHasta = '2026-10-31'; page.estatus = 'pendiente'; page.soloMios = true;
    page.equipoTipo = 'maquinas'; page.equipoId = 4; page.busqueda = 'Aceite';
    await page.cargar(2);
    const [recurso, params] = consulta.listado.calls.mostRecent().args;
    expect(recurso).toBe('servicios'); expect(params).toEqual({ page: 2, q: 'Aceite', estatus: 'pendiente', solo_mios: 1,
      fecha_desde: '2026-10-01', fecha_hasta: '2026-10-31', equipo_tipo: 'maquinas', maquina_id: 4 });
    expect(params.vehiculo_id).toBeUndefined();
  });
  it('filtra todos los vehículos o máquinas al elegir el tipo sin exigir un equipo concreto', async () => {
    const page = await abrir();
    page.equipoTipo = 'vehiculos'; page.cambiarTipoEquipo(); await render();
    const vehiculos = consulta.listado.calls.allArgs().filter((args: any[]) => args[0] === 'servicios').pop();
    expect(vehiculos[1].equipo_tipo).toBe('vehiculos'); expect(vehiculos[1].vehiculo_id).toBeUndefined(); expect(vehiculos[1].maquina_id).toBeUndefined();
    page.equipoTipo = 'maquinas'; page.cambiarTipoEquipo(); await render();
    const maquinas = consulta.listado.calls.allArgs().filter((args: any[]) => args[0] === 'servicios').pop();
    expect(maquinas[1].equipo_tipo).toBe('maquinas'); expect(maquinas[1].vehiculo_id).toBeUndefined();
    page.limpiarFiltros(); await render(); expect(consulta.listado.calls.mostRecent().args[1].equipo_tipo).toBeUndefined();
  });
  it('destaca el equipo y coloca fecha debajo del estado en el listado', async () => {
    await abrir();
    const item = harness.routeNativeElement!.querySelector('.lista-servicios ion-item')!;
    const titulo = item.querySelector('.servicio-resumen h2')!;
    const trabajo = item.querySelector('.servicio-resumen p')!;
    expect(titulo.textContent).toBe('Perforadora'); expect(trabajo.textContent).toBe('Cambio de aceite · cada 500 h');
    const lateral = item.querySelector('.servicio-lateral')!;
    expect(lateral.children[0].tagName).toBe('ION-BADGE'); expect(lateral.children[1].tagName).toBe('TIME');
    expect(item.querySelector('.servicio-resumen time')).toBeNull();
  });
  it('usa nombre e intervalo del catálogo y conserva la descripción manual fuera del listado', async () => {
    const datos = lista(); datos.data[0].descripcion = 'Descripción escrita a mano';
    datos.data[0].servicio_preventivo = { id: 1, nombre: 'General', intervalo_valor: 500, unidad: 'horas' };
    consulta.listado.and.returnValue(of(datos)); const page = await abrir();
    const textoTipo = () => harness.routeNativeElement!.querySelector('.servicio-resumen p')!.textContent!;
    expect(textoTipo()).toBe('General · cada 500 h'); expect(textoTipo()).not.toContain('Descripción escrita');
    page.filas[0].servicio_preventivo = { id: 2, nombre: 'Vehicular', intervalo_valor: 10000, unidad: 'km' }; await render();
    expect(textoTipo()).toBe('Vehicular · cada 10,000 km');
    page.filas[0].servicio_preventivo = null; page.filas[0].servicio_preventivo_tipo_id = 9; await render();
    expect(textoTipo()).toBe('Tipo de servicio no disponible');
    page.filas[0].servicio_preventivo_tipo_id = null; await render();
    expect(textoTipo()).toBe('Sin tipo de servicio asignado');
  });
  it('rechaza fechas invertidas o inexistentes sin enviar consultas', async () => {
    const page = await abrir(); consulta.listado.calls.reset();
    page.fechaDesde = '2026-10-25'; page.fechaHasta = '2026-10-24'; await page.cargar(); await render();
    expect(texto()).toContain('La fecha final no puede ser anterior'); expect(consulta.listado).not.toHaveBeenCalled();
    page.fechaDesde = '2026-02-30'; page.fechaHasta = ''; await page.cargar();
    expect(page.error).toBe('Captura fechas válidas.'); expect(consulta.listado).not.toHaveBeenCalled();
  });
  it('busca equipos por catálogo con paginación y selecciona vehículo sin pedir IDs manuales', async () => {
    const page = await abrir(); page.equipoTipo = 'vehiculos'; page.equipoBusqueda = 'ABC';
    consulta.listado.and.returnValue(of({ ok: true, data: [{ id: 7, marca: 'Camión', placas: 'ABC-123' }],
      meta: { current_page: 2, last_page: 3, total: 51, per_page: 25 } }));
    await page.cargarEquipos(2); expect(consulta.listado.calls.mostRecent().args).toEqual(['vehiculos', { page: 2, q: 'ABC' }]);
    expect(page.equipos[0].placas).toBe('ABC-123'); page.equipoId = 7; await page.cargar();
    expect(consulta.listado.calls.mostRecent().args[1].vehiculo_id).toBe(7);
    expect(consulta.listado.calls.mostRecent().args[1].maquina_id).toBeUndefined();
  });
  it('conserva visible el equipo seleccionado al buscar o paginar otras opciones', async () => {
    const page = await abrir(); page.equipoTipo = 'vehiculos'; page.equipoId = 7;
    page.equipos = [{ id: 7, marca: 'Camión elegido', placas: 'ABC-123' }]; page.seleccionarEquipo(); await render();
    consulta.listado.and.returnValue(of({ ok: true, data: [{ id: 9, marca: 'Otro equipo' }], meta: { current_page: 2, last_page: 2, total: 26, per_page: 25 } }));
    await page.cargarEquipos(2); await render();
    expect(page.equipoId).toBe(7); expect(page.equipoSeleccionadoFueraPagina).toBeTrue();
    expect(texto()).toContain('Camión elegido');
  });
  it('limpia equipo y fechas sin arrastrar filtros de una selección anterior', async () => {
    const page = await abrir(); page.equipoTipo = 'vehiculos'; page.equipoId = 7; page.fechaDesde = '2026-10-01'; page.soloMios = true;
    page.limpiarFiltros(); await render();
    expect(page.equipoId).toBeNull(); expect(page.fechaDesde).toBe('');
    expect(consulta.listado.calls.mostRecent().args[1]).toEqual({ page: 1, q: '', estatus: '', solo_mios: 0 });
  });
  it('recarga el detalle al regresar de una edición en el outlet de Ionic', async () => {
    const page = await abrir('/servicios/17'); page.ionViewDidLeave();
    const actualizado = detalle(); actualizado.data.descripcion = 'Servicio actualizado'; consulta.detalle.and.returnValue(of(actualizado));
    await page.ionViewWillEnter(); await render(); expect(texto()).toContain('Servicio actualizado'); expect(consulta.detalle).toHaveBeenCalledTimes(2);
  });
  it('renderiza orden, materiales, avance, documentos, evidencia y costos de solo lectura', async () => {
    await abrir('/servicios/17');
    for (const esperado of ['OSM-26-000017', 'Filtro principal', 'No se solicitará', 'No requiere reemplazo', 'Faltante',
      'SMA-26-000009', 'SAL-004', 'OC-002', 'Motor revisado', 'Juan Pérez']) expect(texto()).toContain(esperado);
    expect(harness.routeNativeElement?.querySelector('img')?.getAttribute('alt')).toBe('Motor revisado');
    expect(harness.routeNativeElement?.querySelector('input[type="number"]')).toBeNull();
  });
  it('muestra el folio cerrado y permite desplegar cada material una sola vez con su avance', async () => {
    await abrir('/servicios/17');
    const bloque = harness.routeNativeElement!.querySelector('details.orden-desplegable') as HTMLDetailsElement;
    expect(bloque.open).toBeFalse();
    expect(bloque.querySelector('summary')!.textContent).toContain('OSM-26-000017');
    (bloque.querySelector('summary') as HTMLElement).click();
    expect(bloque.open).toBeTrue();
    const filas = bloque.querySelectorAll('.orden-partida');
    expect(filas.length).toBe(2);
    expect(Array.from(bloque.querySelectorAll('.orden-producto strong')).filter(n => n.textContent === 'Aceite').length).toBe(1);
    expect(filas[0].querySelector('.orden-avance')).toBeNull();
    expect(filas[1].querySelectorAll('.orden-avance dd')[0].textContent).toContain('4 L');
    expect(filas[1].querySelectorAll('.orden-avance dd')[1].textContent).toContain('6 L');
    (bloque.querySelector('summary') as HTMLElement).click(); expect(bloque.open).toBeFalse();
  });
  it('asocia el avance por identidad aunque el orden de productos sea distinto', async () => {
    const page = await abrir('/servicios/17');
    page.servicio!.materiales = [
      { id: 1, producto_id: 5, material_preventivo_id: 3, producto: 'Mismo nombre', cantidad_requerida: 1, unidad: 'PZA', incluido: true, motivo_exclusion: null },
      { id: 2, producto_id: 6, material_preventivo_id: 4, producto: 'Mismo nombre', cantidad_requerida: 2, unidad: 'PZA', incluido: true, motivo_exclusion: null },
    ];
    page.servicio!.avance_materiales = [
      { producto_id: 6, material_preventivo_id: 4, producto: 'Mismo nombre', requerido: 2, surtido: 2, faltante: 0, disponible: 0, estado: 'surtido' },
      { producto_id: 5, material_preventivo_id: 3, producto: 'Mismo nombre', requerido: 1, surtido: 0, faltante: 1, disponible: 0, estado: 'sin_existencia' },
    ];
    expect(page.materialesConAvance[0].avance!.faltante).toBe(1);
    expect(page.materialesConAvance[1].avance!.faltante).toBe(0);
  });
  it('resume abastecimiento en el folio sin perder el seguimiento dentro del desplegable', async () => {
    const page = await abrir('/servicios/17');
    const badge = () => harness.routeNativeElement!.querySelector('.abastecimiento-badge')!;
    expect(badge().textContent).toContain('Surtido parcial');
    expect(harness.routeNativeElement!.querySelector('.orden-desplegable .orden-solicitudes')!.textContent).toContain('SMA-26-000009');
    page.servicio!.solicitudes[0].tipo = 'compra'; page.servicio!.solicitudes[0].estado = 'pendiente';
    page.servicio!.avance_materiales[0].surtido = 0; page.servicio!.solicitudes[0].ordenes_compra[0].estado = 'BORRADOR';
    await render(); expect(badge().textContent).toContain('Compra pendiente');
    page.servicio!.avance_materiales[0].faltante = 0; page.servicio!.avance_materiales[0].surtido = 10;
    await render(); expect(badge().textContent).toContain('Surtida'); expect(badge().getAttribute('data-tono')).toBe('surtido');
    page.servicio!.avance_materiales[0].faltante = 10; page.servicio!.avance_materiales[0].surtido = 0;
    page.servicio!.solicitudes[0].estado = 'surtida';
    await render(); expect(badge().textContent).toContain('Material pendiente');
    page.servicio!.solicitudes[0].estado = 'cancelada';
    await render(); expect(badge().textContent).toContain('Solicitudes canceladas');
    page.servicio!.solicitudes = [];
    await render(); expect(badge().textContent).toContain('Sin solicitar');
    page.servicio!.materiales.forEach(material => material.incluido = false);
    await render(); expect(badge().textContent).toContain('Sin materiales');
  });
  it('la compra solo avanza con OC autorizada aunque exista el estado anterior en compra', async () => {
    const page = await abrir('/servicios/17');
    const s = page.servicio!; s.avance_materiales[0].surtido = 0;
    const solicitud = s.solicitudes[0]; solicitud.tipo = 'compra'; solicitud.estado = 'en_compra';
    solicitud.ordenes_compra[0].estado = 'BORRADOR';
    await render(); expect(page.estadoAbastecimiento.texto).toBe('Compra pendiente');
    solicitud.ordenes_compra[0].estado = 'AUTORIZADA';
    await render(); expect(page.estadoAbastecimiento.texto).toBe('Compra en proceso');
    expect(texto()).not.toContain('Compra en compra');
    solicitud.ordenes_compra[0].estado = 'BORRADOR';
    await render(); expect(page.estadoAbastecimiento.texto).toBe('Compra pendiente');
    solicitud.estado = 'material_en_almacen';
    expect(page.estadoAbastecimiento.texto).toBe('Material en almacén');
  });
  it('conserva todos los cards desplegables y deja ejecución después de las evidencias', async () => {
    const page = await abrir('/servicios/17'); page.servicio!.fecha_inicio = '2026-10-29T16:26:00Z'; await render();
    const contenedor = harness.routeNativeElement!;
    const cards = contenedor.querySelectorAll('details.tarjeta');
    const titulos = Array.from(cards).map(card => card.querySelector('summary')!.textContent!.trim());
    expect(titulos[0]).toContain('Servicio #17');
    expect(titulos[titulos.length - 1]).toBe('Ejecución');
    expect(titulos.indexOf('Evidencias')).toBeLessThan(titulos.indexOf('Ejecución'));
    expect(titulos.indexOf('Ejecución registrada')).toBeLessThan(titulos.indexOf('Ejecución'));
    const galeria = contenedor.querySelector('details[galeria-evidencias]') as HTMLDetailsElement;
    expect(galeria.open).toBeFalse(); (galeria.querySelector('summary') as HTMLElement).click(); expect(galeria.open).toBeTrue();
    expect(galeria.querySelector('img')!.getAttribute('alt')).toBe('Motor revisado');
  });
  it('renderiza vehículo e historial y evita enlazar emergencias fuera de alcance', async () => {
    consulta.detalle.and.returnValue(of({ ok: true, data: { vehiculo: { id: 7, marca: 'Camión', modelo: 'Operativo', placas: 'ABC-123' },
      mantenimientos_recientes: [{ id: 11, tipo: 'emergencia', categoria_mantenimiento: 'Falla', estatus: 'completado' },
        { id: 12, tipo: 'programado', categoria_mantenimiento: 'Preventivo', estatus: 'borrador' }] } }));
    await abrir('/vehiculos/7'); expect(texto()).toContain('Camión Operativo'); expect(texto()).toContain('ABC-123');
    const items = harness.routeNativeElement?.querySelectorAll('ion-item');
    expect(items?.length).toBe(2); expect(items?.[0].getAttribute('href')).toBeNull();
    expect(items?.[1].getAttribute('href')).toContain('/tabs-mecanico/servicios/12');
  });
  it('renderiza vacío y permite recuperar una consulta fallida', async () => {
    consulta.listado.and.returnValue(of({ ok: true, data: [], meta: { current_page: 1, last_page: 1, total: 0, per_page: 25 } }));
    const page = await abrir(); expect(texto()).toContain('No se encontraron resultados');
    consulta.listado.and.returnValue(throwError(() => ({ status: 500, message: 'No disponible' })));
    await page.cargar(); await render(); expect(texto()).toContain('No disponible'); expect(page.meta).toBeNull();
    consulta.listado.and.returnValue(of(lista())); await page.cargar(); await render(); expect(texto()).toContain('Cambio de aceite');
  });
  it('descarta respuestas antiguas de búsquedas concurrentes', async () => {
    const page = await abrir(); const vieja = new Subject<ListaMecanico>(); const nueva = new Subject<ListaMecanico>();
    consulta.listado.and.returnValues(vieja, nueva); const primera = page.cargar(); const segunda = page.cargar();
    nueva.next(lista('Resultado actual')); await segunda; vieja.next(lista('Resultado antiguo')); await primera; await render();
    expect(texto()).toContain('Resultado actual'); expect(texto()).not.toContain('Resultado antiguo');
  });
  it('limpia sesión al recibir 401 durante la consulta', async () => {
    const page = await abrir(); consulta.listado.and.returnValue(throwError(() => ({ status: 401, message: 'Sesión expirada' })));
    await page.cargar(); expect(auth.logout).toHaveBeenCalled(); expect(page.filas).toEqual([]);
  });
  it('revalida contexto y deriva al resolver permisos revocados durante la consulta', async () => {
    const page = await abrir(); const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    consulta.listado.and.returnValue(throwError(() => ({ status: 403, message: 'Sin acceso' })));
    await page.cargar(); expect(auth.getMe).toHaveBeenCalled(); expect(auth.setSelectedPanel).toHaveBeenCalledWith(null);
    expect(navigate).toHaveBeenCalledWith(['/home']);
  });
  it('mantiene el seguimiento visible si falla la búsqueda auxiliar de equipos', async () => {
    const page = await abrir(); page.equipoTipo = 'maquinas';
    consulta.listado.and.returnValue(throwError(() => ({ message: 'Catálogo temporalmente no disponible' })));
    await page.cargarEquipos(); await render();
    expect(texto()).toContain('Cambio de aceite'); expect(texto()).toContain('Catálogo temporalmente no disponible');
    expect(page.error).toBe('');
  });
});
