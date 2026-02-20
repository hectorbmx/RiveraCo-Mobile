// src/app/services/gerencial/gerencial-inventario.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  InventarioStockResponseDto,
  KardexProductoResponseDto,
  KardexResumenResponseDto,
} from 'src/app/models/inventario.model';
import { environment } from 'src/environments/environment';
import { ApiService } from './api';

type Nullable<T> = T | null | undefined;

@Injectable({ providedIn: 'root' })
export class GerencialInventarioService {
  private readonly base = `${environment.apiUrl}`; // ajusta si tu prefijo es otro

  constructor(
    private http: HttpClient,
    private api: ApiService) {}

  // 1) Lista stock paginada
 stock(params?: {
  almacen_id?: number | null;
  q?: string | null;
  minimos?: 0 | 1 | null;
  page?: number | null;
  per_page?: number | null;
}): Observable<InventarioStockResponseDto> {

  return this.api.get<InventarioStockResponseDto>('gerencial/inventario/stock', {
    almacen_id: params?.almacen_id ?? undefined,
    q: params?.q ?? undefined,
    minimos: params?.minimos ?? undefined,
    page: params?.page ?? undefined,
    per_page: params?.per_page ?? undefined,
  });
}

  // (opcional) 1b) resumen global si ya lo tienes
  resumenStock(params?: { almacen_id?: Nullable<number> }): Observable<any> {
    let p = new HttpParams();
    if (params?.almacen_id) p = p.set('almacen_id', String(params.almacen_id));
    return this.api.get<any>(`gerencial/inventario/stock/resumen`, { params: p });
  }

  // 3) Kardex paginado
  kardexProducto(productoId: number, params?: {
    almacen_id?: Nullable<number>;
    desde?: Nullable<string>;
    hasta?: Nullable<string>;
    page?: Nullable<number>;
    per_page?: Nullable<number>;
  }): Observable<KardexProductoResponseDto> {
    let p = new HttpParams();
    if (params?.almacen_id) p = p.set('almacen_id', String(params.almacen_id));
    if (params?.desde) p = p.set('desde', String(params.desde));
    if (params?.hasta) p = p.set('hasta', String(params.hasta));
    if (params?.page) p = p.set('page', String(params.page));
    if (params?.per_page) p = p.set('per_page', String(params.per_page));

    return this.api.get<KardexProductoResponseDto>(
      `gerencial/inventario/productos/${productoId}/kardex`,
      { params: p }
    );
  }

  // 3b) Resumen del kardex (KPIs)
// gerencial-inventario.service.ts
resumenProducto(productoId: number, params?: {
  almacen_id?: number | null;
  desde?: string | null;
  hasta?: string | null;
  days?: number | null;
}) {
  return this.api.get<KardexResumenResponseDto>(
    `gerencial/inventario/productos/${productoId}/kardex/resumen`,
    {
      almacen_id: params?.almacen_id ?? undefined,
      desde: params?.desde ?? undefined,
      hasta: params?.hasta ?? undefined,
      days: params?.days ?? undefined,
    }
  );
}
}