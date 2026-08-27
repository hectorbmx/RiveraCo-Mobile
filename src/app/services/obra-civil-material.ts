import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';

export interface ObraCivilMaterialGroup {
  id: number;
  code: string;
  name: string;
  family: string;
  grade: string | null;
}

export interface ObraCivilCommercialMaterial {
  id: number;
  sku: string | null;
  descripcion: string;
  category: string | null;
  subcategory: string | null;
  grade: string | null;
  medida: string | null;
  diametro: string | null;
  calibre_espesor: string | null;
  longitud: number | null;
  unidad_compra: string;
  conversion_type: string;
  peso_por_metro: number | null;
  peso_por_pieza: number | null;
  peso_por_m2: number | null;
  peso_por_rollo: number | null;
  factor_conversion: number | null;
  tolerance: string | null;
  validation_status: string | null;
}

export interface ObraCivilMaterial {
  id: number;
  codigo: string | null;
  concepto: string;
  unidad: string | null;
  cantidad: number;
  usado: number;
  disponible: number;
  has_commercial_products: boolean;
  commercial_resolution_status: 'ready' | 'group_found_no_active_products' | 'not_resolved' | 'ambiguous' | string;
  commercial_resolution_reason: string | null;
  commercial_resolution_confidence: string | null;
  material_group: ObraCivilMaterialGroup | null;
  commercial_products_count: number;
  commercial_products: ObraCivilCommercialMaterial[];
}

export interface ObraCivilMaterialCatalogoResponse {
  ok: boolean;
  obra: {
    id: number;
    nombre: string | null;
    clave_obra: string | null;
    cliente_nombre: string | null;
    tipo_obra: string | null;
  };
  data: ObraCivilMaterial[];
  meta: {
    page: number;
    per_page: number;
    has_more: boolean;
    total: number;
  };
}


export interface ObraCivilMaterialSolicitudOc {
  id: number;
  folio: string | null;
  estado: string | null;
}

export interface ObraCivilMaterialSolicitudItem {
  id: number;
  obra_civil_insumo_id: number;
  quantity: number;
  approved_quantity: number | null;
  unit: string | null;
  notes: string | null;
  approval_notes: string | null;
  insumo_snapshot: any;
  insumo: {
    id: number;
    codigo: string | null;
    concepto: string;
    unidad: string | null;
  } | null;
  ordenes_compra: ObraCivilMaterialSolicitudOc[];
  has_final_order: boolean;
  has_draft_order: boolean;
}

export interface ObraCivilMaterialSolicitudResumen {
  id: number;
  folio: string | null;
  obra_id: number;
  status: string;
  notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  items_count: number;
  approved_items_count: number;
  has_purchase_order: boolean;
  has_final_purchase_order: boolean;
  has_draft_purchase_order: boolean;
  ordenes_compra: ObraCivilMaterialSolicitudOc[];
  items: ObraCivilMaterialSolicitudItem[];
}

export interface ObraCivilMaterialSolicitudesResponse {
  ok: boolean;
  obra: ObraCivilMaterialCatalogoResponse['obra'];
  data: ObraCivilMaterialSolicitudResumen[];
  meta: {
    page: number;
    per_page: number;
    has_more: boolean;
    total: number;
  };
}
export interface ObraCivilMaterialCommercialItemPayload {
  commercial_material_id: number;
  commercial_quantity: number;
}

export interface ObraCivilMaterialSolicitudItemPayload {
  obra_civil_insumo_id: number;
  quantity: number;
  commercial_items?: ObraCivilMaterialCommercialItemPayload[];
  commercial_material_id?: number | null;
  commercial_quantity?: number | null;
  notes?: string | null;
}

export interface ObraCivilMaterialSolicitudPayload {
  notes?: string | null;
  items: ObraCivilMaterialSolicitudItemPayload[];
}

export interface ObraCivilMaterialSolicitudResponse {
  ok: boolean;
  message: string;
  data: {
    id: number;
    folio: string | null;
    status: string;
    submitted_at: string | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ObraCivilMaterialService {
  constructor(private api: ApiService) {}

  catalogo(params: {
    q?: string;
    page?: number;
    per_page?: number;
  }): Observable<ObraCivilMaterialCatalogoResponse> {
    return this.api.get<ObraCivilMaterialCatalogoResponse>('residente/obra-civil/materiales', params);
  }

  solicitudes(params: {
    page?: number;
    per_page?: number;
  }): Observable<ObraCivilMaterialSolicitudesResponse> {
    return this.api.get<ObraCivilMaterialSolicitudesResponse>('residente/obra-civil/materiales/solicitudes', params);
  }

  store(payload: ObraCivilMaterialSolicitudPayload): Observable<ObraCivilMaterialSolicitudResponse> {
    return this.api.post<ObraCivilMaterialSolicitudResponse>('residente/obra-civil/materiales/solicitudes', payload);
  }
}




