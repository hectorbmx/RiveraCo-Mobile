import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { VehiculoDetalleConsultaService } from './vehiculo-detalle-consulta.service';
import { VehiculosResponse, VehiculoDetalleResponse, VehiculoHistorialFiltros } from '../models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosGerencialService {
  constructor(private api: ApiService, private detalleConsulta: VehiculoDetalleConsultaService) {}

  getVehiculos(page?: number, q?: string, asignado?: boolean) {
    const params: Record<string, any> = {};

    if (page && page > 1) params['page'] = page;
    if (q && q.trim() !== '') params['q'] = q.trim();
    if (asignado) params['asignado'] = 1;

    return this.api.get<VehiculosResponse>('gerencial/vehiculos', params);
  }

  getDetalle(id: number) { return this.api.get<VehiculoDetalleResponse>(`gerencial/vehiculos/${id}`); }

  getAsignaciones(id: number, filtros: VehiculoHistorialFiltros) {
    return this.detalleConsulta.getAsignaciones(id, filtros);
  }
  getServicios(id: number, filtros: VehiculoHistorialFiltros) {
    return this.detalleConsulta.getServicios(id, filtros);
  }
  getSeguros(id: number, filtros: VehiculoHistorialFiltros) {
    return this.detalleConsulta.getSeguros(id, filtros);
  }
  getRegistrosCombustible(id: number, filtros: VehiculoHistorialFiltros) {
    return this.detalleConsulta.getRegistrosCombustible(id, filtros);
  }
  getSalidas(id: number, filtros: VehiculoHistorialFiltros) {
    return this.detalleConsulta.getSalidas(id, filtros);
  }
}
