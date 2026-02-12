export interface ClienteDTO {
  id: number;
  nombre: string;
}

export interface ObraListItemDTO {
  id: number;
  cliente: ClienteDTO | null;
  nombre: string;
  clave_obra: string;
  ubicacion: string;
  estatus_nuevo: number;
  fecha_inicio_programada: string | null;
  fecha_inicio_real: string | null;
}

export interface ObrasIndexMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ObrasIndexResponse {
  ok: boolean;
  data: {
    current_page: number;
    data: ObraListItemDTO[];
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
  meta: ObrasIndexMeta;
}
