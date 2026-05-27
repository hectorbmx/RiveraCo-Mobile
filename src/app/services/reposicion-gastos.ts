import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';

export type TipoReposicion = 'caja_chica' | 'viaticos' | 'gastos_varios';

export interface ReposicionPartida {
  id: number;
  partida: string | null;
  concepto: string | null;
  unidad: string | null;
  cantidad: number | null;
  precio_unitario: number | null;
  monto_programado: number | null;
  numero_semana: number | null;
}

export interface ReposicionConcepto {
  tipo: string;
  descripcion?: string | null;
  proveedor?: string | null;
  rfc?: string | null;
  uuid?: string | null;
  fecha?: string | null;
  monto: number;
  sat_cfdi_id?: number | null;
  partida_id?: number | null;
}

export interface ReposicionGasto {
  id: number;
  folio: string;
  tipo_reposicion: TipoReposicion;
  tipo_label: string;
  semana: string;
  estatus: string;
  estatus_label: string;
  observaciones: string | null;
  total: number;
  detalles_count: number;
  partida: ReposicionPartida | null;
  solicitado_at: string | null;
  fecha_programada_pago: string | null;
  detalles?: ReposicionConcepto[];
}

export interface ReposicionCfdi {
  id: number;
  uuid: string | null;
  uuid_corto: string | null;
  fecha: string | null;
  fecha_formateada: string | null;
  rfc_emisor: string | null;
  emisor_nombre: string | null;
  rfc_receptor: string | null;
  receptor_nombre: string | null;
  subtotal: number;
  total: number;
  moneda: string;
  metodo_pago: string | null;
  forma_pago: string | null;
}

export interface ReposicionesIndexResponse {
  ok: boolean;
  obra: {
    id: number;
    nombre: string | null;
    clave_obra: string | null;
    cliente_nombre: string | null;
  };
  stats: {
    total: number;
    solicitadas: number;
    en_revision: number;
    autorizadas: number;
  };
  montos: {
    solicitado: number;
    autorizado: number;
    pagado: number;
  };
  data: ReposicionGasto[];
}

export interface ReposicionCatalogoResponse {
  ok: boolean;
  data: ReposicionPartida[];
}

export interface ReposicionCfdiResponse {
  ok: boolean;
  data: ReposicionCfdi[];
}

export interface ReposicionStorePayload {
  tipo_reposicion: TipoReposicion;
  partida_id: number;
  semana: string;
  observaciones?: string | null;
  conceptos: ReposicionConcepto[];
}

@Injectable({
  providedIn: 'root'
})
export class ReposicionGastosService {
  constructor(private api: ApiService) {}

  index(): Observable<ReposicionesIndexResponse> {
    return this.api.get<ReposicionesIndexResponse>('residente/reposicion-gastos');
  }

  catalogo(): Observable<ReposicionCatalogoResponse> {
    return this.api.get<ReposicionCatalogoResponse>('residente/reposicion-gastos/catalogo');
  }

  buscarCfdis(params: {
    rfc_emisor?: string;
    fecha?: string;
    monto?: number | null;
    uuid4?: string;
  }): Observable<ReposicionCfdiResponse> {
    return this.api.get<ReposicionCfdiResponse>('residente/reposicion-gastos/buscar-cfdis', params);
  }

  store(payload: ReposicionStorePayload): Observable<{ ok: boolean; message: string; data: ReposicionGasto }> {
    return this.api.post<{ ok: boolean; message: string; data: ReposicionGasto }>('residente/reposicion-gastos', payload);
  }
}
