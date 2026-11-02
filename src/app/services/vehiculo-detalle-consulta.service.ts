import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { VehiculoFichaDetalleResponse, VehiculoHistorialResponse, VehiculoHistorialFiltros,
  VehiculoAsignacionDto, VehiculoServicioDto, VehiculoSeguroDto, VehiculoCombustibleRegistroDto,
  VehiculoSalidaDto } from '../models/vehiculo.model';

export type PanelConsultaVehiculo = 'gerencial' | 'mecanico';
@Injectable({ providedIn: 'root' })
export class VehiculoDetalleConsultaService {
  constructor(private api: ApiService) {}
  getDetalle(id: number, panel: PanelConsultaVehiculo = 'gerencial') {
    const ruta = `${panel}/vehiculos/${id}` + (panel === 'mecanico' ? '/detalle' : '');
    return this.api.get<VehiculoFichaDetalleResponse>(ruta);
  }
  getAsignaciones(id: number, filtros: VehiculoHistorialFiltros, panel: PanelConsultaVehiculo = 'gerencial') {
    return this.api.get<VehiculoHistorialResponse<VehiculoAsignacionDto>>(`${panel}/vehiculos/${id}/asignaciones`, filtros);
  }
  getServicios(id: number, filtros: VehiculoHistorialFiltros, panel: PanelConsultaVehiculo = 'gerencial') {
    return this.api.get<VehiculoHistorialResponse<VehiculoServicioDto>>(`${panel}/vehiculos/${id}/servicios`, filtros);
  }
  getSeguros(id: number, filtros: VehiculoHistorialFiltros, panel: PanelConsultaVehiculo = 'gerencial') {
    return this.api.get<VehiculoHistorialResponse<VehiculoSeguroDto>>(`${panel}/vehiculos/${id}/seguros`, filtros);
  }
  getRegistrosCombustible(id: number, filtros: VehiculoHistorialFiltros, panel: PanelConsultaVehiculo = 'gerencial') {
    return this.api.get<VehiculoHistorialResponse<VehiculoCombustibleRegistroDto>>(`${panel}/vehiculos/${id}/combustible`, { ...filtros, fuente: 'registros' });
  }
  getSalidas(id: number, filtros: VehiculoHistorialFiltros, panel: PanelConsultaVehiculo = 'gerencial') {
    return this.api.get<VehiculoHistorialResponse<VehiculoSalidaDto>>(`${panel}/vehiculos/${id}/combustible`, { ...filtros, fuente: 'almacen' });
  }
}
