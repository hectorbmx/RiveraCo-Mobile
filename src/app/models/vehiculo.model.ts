export interface VehiculoEmpleadoDto {
  id: number;
  nombre: string;
  puesto?: string | null;
  celular?: string | null;
}

export interface VehiculoAsignacionDto {
  id: number;
  vehiculo_id: number;
  empleado_id?: number | null;
  fecha_asignacion?: string | null;
  fecha_fin?: string | null;
  km_inicial?: number | string | null;
  km_final?: number | string | null;
  notas?: string | null;
  empleado?: VehiculoEmpleadoDto | null;
}

export interface VehiculoSeguroDto {
  id: number;
  aseguradora?: string | null;
  poliza_numero?: string | null;
  tipo_seguro?: string | null;
  vigencia_desde?: string | null;
  vigencia_hasta?: string | null;
  estatus?: 'futura' | 'vigente' | 'vencida' | 'cancelada' | string | null;
  documento_url?: string | null;
}

export interface VehiculoDocumentoDto {
  id: number;
  tipo?: string | null;
  nombre_original?: string | null;
  archivo_url?: string | null;
  fecha_vencimiento?: string | null;
  vigente?: boolean;
}

export interface VehiculoListItemDto {
  id: number;
  marca?: string | null;
  modelo?: string | null;
  anio?: string | number | null;
  color?: string | null;
  placas?: string | null;
  serie?: string | null;
  tipo?: string | null;
  estatus?: string | null;
  fecha_registro?: string | null;
  foto_url?: string | null;
  asignado: boolean;
  asignacion_actual?: VehiculoAsignacionDto | null;
  seguro_vigente?: VehiculoSeguroDto | null;
  tarjeta_circulacion?: VehiculoDocumentoDto | null;
}

export interface VehiculosResponse {
  ok: boolean;
  data: {
    current_page: number;
    data: VehiculoListItemDto[];
    total: number;
    last_page: number;
  };
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
