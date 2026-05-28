// src/app/services/gerencial-maquinas.service.ts

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MaquinaListItemDto } from '../models/maquina.model';
import { ApiService } from './api';
@Injectable({
  providedIn: 'root'
})
export class MaquinasGerencialService {
  
  private apiUrl = `${environment.apiUrl}/gerencial/maquinas`;

  constructor(
    private http: HttpClient,
    private api: ApiService) { }

  /**
   * Obtiene la lista de máquinas con filtros opcionales
   */
getMaquinas(page?: number, q?: string, enUso?: boolean) {
  const params: any = {};

  // Solo agrega los params si tienen valor real
  if (page && page > 1) params['page'] = page;
  if (q && q.trim() !== '') params['q'] = q.trim();
  if (enUso) params['en_uso'] = 1;

  return this.api.get('gerencial/maquinas', params);
}
  /**
   * Obtiene el detalle de una máquina específica
   */
  getMaquinaById(id: number): Observable<{ok: boolean, data: MaquinaListItemDto}> {
    return this.api.get<{ok: boolean, data: MaquinaListItemDto}>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene los registros de una máquina (horómetros, combustibles, etc)
   */
  getRegistrosMaquina(id: number): Observable<any> {
    return this.api.get(`${this.apiUrl}/${id}/registros`);
  }

  /**
   * Obtiene el resumen de registros
   */
  getResumenRegistros(id: number): Observable<any> {
    return this.api.get(`${this.apiUrl}/${id}/registros/resumen`);
  }
}
