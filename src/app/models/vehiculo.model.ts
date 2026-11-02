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
  fotos?: VehiculoFotoDto[];
}

export interface VehiculoFotoDto { id: number; orden: number | null; url: string | null; }

export interface VehiculoSeguroDto {
  id: number;
  aseguradora?: string | null;
  poliza_numero?: string | null;
  tipo_seguro?: string | null;
  vigencia_desde?: string | null;
  vigencia_hasta?: string | null;
  estatus?: 'futura' | 'vigente' | 'vencida' | 'cancelada' | string | null;
  documento_url?: string | null;
  comprobante_url?: string | null;
  metodo_pago?: string | null;
  frecuencia_pago?: string | null;
  moneda?: string | null;
  fecha_compra?: string | null;
  costo?: number | null;
  suma_asegurada?: number | null;
  deducible?: number | null;
  cobertura?: string | null;
  observaciones?: string | null;
  alerta_vencimiento_activa?: boolean;
  dias_preaviso?: number | null;
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

export interface VehiculoServicioDto {
  id: number;
  tipo: string | null;
  categoria_mantenimiento: string | null;
  descripcion: string | null;
  estatus: string | null;
  notas: string | null;
  km_actuales: number | null;
  km_proximo_servicio: number | null;
  horometro: number | null;
  costo_total: number | null;
  fecha_programada: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  mecanico: { id: number; nombre: string } | null;
}
export interface VehiculoObraDto { id: number; nombre: string; clave_obra: string | null; }
export interface VehiculoCombustibleRegistroDto {
  id: number; vehiculo_id: number; vehiculo_empleado_id: number | null;
  origen: string | null; fecha: string | null; km: number | null;
  monto_gasolina: number | null; notas: string | null; obra: VehiculoObraDto | null;
  empleado: { id: number; nombre: string } | null;
  capturado_por: { id: number; nombre: string } | null;
  foto_url: string | null; foto_ticket_gasolina_url: string | null;
}
export interface VehiculoSalidaDto {
  id: number; vehiculo_id: number;
  documento: { id: number; folio: string | null; fecha: string | null; tipo: 'salida'; estado: 'aplicado' };
  producto: { id: number; nombre: string | null; sku: string | null } | null;
  cantidad: number | null; costo_unitario: number | null;
  obra: VehiculoObraDto | null; notas: string | null;
}
export interface VehiculoDetalleDto {
  vehiculo: Omit<VehiculoListItemDto, 'asignado' | 'asignacion_actual' | 'seguro_vigente' | 'tarjeta_circulacion'>;
  asignacion_actual: VehiculoAsignacionDto | null;
  asignaciones_recientes: VehiculoAsignacionDto[];
  seguro_vigente: VehiculoSeguroDto | null;
  seguros_recientes: VehiculoSeguroDto[];
  mantenimientos_recientes: (Omit<VehiculoServicioDto, 'km_actuales' | 'km_proximo_servicio' | 'horometro'> & {
    km_actuales: number | string | null;
    km_proximo_servicio: number | string | null;
    horometro: number | string | null;
  })[];
  mantenimientos_resumen: { total: number; pendiente: number; en_proceso: number; completado: number; cancelado: number };
  documentos: VehiculoDocumentoDto[];
  documentos_resumen: { total: number; vigentes: number; vencidos: number; por_vencer: number };
}
export interface VehiculoDetalleResponse { ok: boolean; data: VehiculoDetalleDto; }
export interface VehiculoHistorialMeta {
  vehiculo_id: number; current_page: number; last_page: number; per_page: number; total: number;
  fuente?: 'registros' | 'almacen';
}
export interface VehiculoHistorialResponse<T> { ok: boolean; data: T[]; meta: VehiculoHistorialMeta; }
export interface VehiculoHistorialFiltros { page: number; per_page?: number; desde?: string; hasta?: string; estatus?: string; }

// Ficha común a gerencial y al nuevo detalle ampliado del mecánico.
export type VehiculoFichaDetalleDto = Pick<VehiculoDetalleDto, 'vehiculo' | 'asignacion_actual' | 'seguro_vigente'>;
export interface VehiculoFichaDetalleResponse { ok: boolean; data: VehiculoFichaDetalleDto; }
