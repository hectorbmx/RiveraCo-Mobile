import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';

export interface ObraCivilAvanceConcepto {
  id: number;
  clave: string | null;
  descripcion: string;
  unidad: string | null;
  cantidad: number;
  estimado: number;
  reportado: number;
  disponible: number;
  edificio: string | null;
  partida: string | null;
}

export interface ObraCivilAvanceCatalogoResponse {
  ok: boolean;
  obra: {
    id: number;
    nombre: string | null;
    clave_obra: string | null;
    cliente_nombre: string | null;
    tipo_obra: string | null;
  };
  data: ObraCivilAvanceConcepto[];
  meta: {
    page: number;
    per_page: number;
    has_more: boolean;
    total: number;
  };
}


export interface ObraCivilAvanceReporteFoto {
  id: number;
  path: string | null;
  url: string | null;
  mime_type: string | null;
  size: number | null;
}

export interface ObraCivilAvanceReporteItem {
  id: number;
  civil_concept_id: number;
  quantity: number;
  unit: string | null;
  notes: string | null;
  concept_snapshot: any;
  photos: ObraCivilAvanceReporteFoto[];
}

export interface ObraCivilAvanceReporteResumen {
  id: number;
  obra_id: number;
  status: string;
  notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  is_editable: boolean;
  items: ObraCivilAvanceReporteItem[];
}

export interface ObraCivilAvanceReportesResponse {
  ok: boolean;
  obra: ObraCivilAvanceCatalogoResponse['obra'];
  data: ObraCivilAvanceReporteResumen[];
  meta: {
    page: number;
    per_page: number;
    has_more: boolean;
    total: number;
  };
}
export interface ObraCivilAvanceReporteResponse {
  ok: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    submitted_at: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ObraCivilAvanceService {
  constructor(private api: ApiService) {}

  catalogo(params: {
    q?: string;
    page?: number;
    per_page?: number;
  }): Observable<ObraCivilAvanceCatalogoResponse> {
    return this.api.get<ObraCivilAvanceCatalogoResponse>('residente/obra-civil/avance/catalogo', params);
  }

  reportes(params: {
    page?: number;
    per_page?: number;
  }): Observable<ObraCivilAvanceReportesResponse> {
    return this.api.get<ObraCivilAvanceReportesResponse>('residente/obra-civil/avance/reportes', params);
  }

  store(formData: FormData): Observable<ObraCivilAvanceReporteResponse> {
    return this.api.postMultipart<ObraCivilAvanceReporteResponse>('residente/obra-civil/avance/reportes', formData);
  }
}

