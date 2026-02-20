import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  ApiOk, AreaDto,
  EmpleadoListItemDto,
  EmpleadoStatusFilter, LaravelPaginator
} from '../models/empleado.model';
import { ApiService } from './api';

export interface EmpleadosIndexParams {
  q?: string;
  status?: EmpleadoStatusFilter; // activos | baja | todos
  obra_id?: number;
  solo_asignados?: boolean;      // default true en backend si obra_id
  rol_id?: number;
  area_id?: number;
  page?: number;
  per_page?: number;
}

@Injectable({ providedIn: 'root' })
export class GerencialPersonalService {
  // AJUSTA si tu base ya incluye /api/v1
  private readonly base = 'gerencial/empleados';

  constructor(
    private api: ApiService,
    private http: HttpClient) {}

//   index(params: EmpleadosIndexParams = {}): Observable<ApiOk<EmpleadoListItemDto[]>> {
  index(params: EmpleadosIndexParams = {}): Observable<ApiOk<LaravelPaginator<EmpleadoListItemDto>>> {


    const httpParams: any = {
      ...params,
      // backend suele esperar 0/1 si mandas boolean
      ...(typeof params.solo_asignados === 'boolean'
        ? { solo_asignados: params.solo_asignados ? 1 : 0 }
        : {}),
    };

    return this.api.get(this.base, httpParams);
  }

  show(id: number): Observable<ApiOk<any>> {
    return this.api.get(`${this.base}/${id}`);
  }
  getEmpleado(id: string | number) {
  return this.api.get<any>(`${this.base}/${id}`);
}
  areas(): Observable<{ ok: boolean; data: AreaDto[] }> {
    return this.http.get<{ ok: boolean; data: AreaDto[] }>(`/api/v1/areas`);
  }
}
