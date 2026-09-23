import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { VehiculosResponse } from '../models/vehiculo.model';

@Injectable({
  providedIn: 'root',
})
export class VehiculosGerencialService {
  constructor(private api: ApiService) {}

  getVehiculos(page?: number, q?: string, asignado?: boolean) {
    const params: Record<string, any> = {};

    if (page && page > 1) params['page'] = page;
    if (q && q.trim() !== '') params['q'] = q.trim();
    if (asignado) params['asignado'] = 1;

    return this.api.get<VehiculosResponse>('gerencial/vehiculos', params);
  }
}
