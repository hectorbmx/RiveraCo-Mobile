export interface PreventivoMaquinaDto {
  servicio_id: number | null;
  servicio_nombre: string;
  servicio_codigo?: string | null;
  servicio_tipo_actual?: string | null;
  servicio_tipo_siguiente?: string | null;
  servicio_tipo_codigo?: string | null;
  servicio_tipo_nombre?: string | null;
  estado: 'sin_datos' | 'ok' | 'proximo' | 'vencido';
  label: string;
  color: string;
  horas_usadas: number | null;
  horas_restantes: number | null;
  intervalo_horas: number;
  porcentaje: number;
  proximo_horometro: number | null;
  proximo_fecha: string | null;
}

export interface ResumenPreventivoMaquinaDto extends PreventivoMaquinaDto {
  horometro_actual: number | null;
  servicios: PreventivoMaquinaDto[];
}

export interface MaquinaListItemDto {
  id: number;
  codigo?: string | null;
  nombre: string | null;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  placas: string | null;
  horometro_base: number | string | null;
  estado: string | null;
  ubicacion?: string | null;
  horometro_actual?: number | null;
  fecha_ultima_lectura?: string | null;
  preventivo?: ResumenPreventivoMaquinaDto | null;
  asignada: boolean;
  obra_activa: {
    id: number;
    nombre: string;
    clave_obra: string | null;
    estatus_nuevo: number | string | null;
  } | null;
}

export interface MaquinasResponse {
  ok: boolean;
  data: {
    current_page: number;
    data: MaquinaListItemDto[];
    total: number;
    last_page: number;
  };
}

export interface AsignacionMaquinaDto {
  obra_maquina_id: number;
  fecha_inicio: string | null;
  horometro_inicio: number | string | null;
  estado: string;
  obra: (NonNullable<MaquinaListItemDto['obra_activa']> & { ubicacion?: string | null }) | null;
}

export interface ServicioRecienteMaquinaDto {
  id: number;
  tipo: string | null;
  categoria_mantenimiento: string | null;
  descripcion: string | null;
  horometro: number | string | null;
  fecha_programada: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  estatus: string | null;
  costo_total: number | null;
  notas: string | null;
  mecanico: { id: number; nombre: string } | null;
}

export interface MaquinaDetalleDto {
  maquina: Omit<MaquinaListItemDto, 'asignada' | 'obra_activa'> & {
    numero_serie: string | null;
    color: string | null;
    notas: string | null;
  };
  asignacion_activa: AsignacionMaquinaDto | null;
  asignacion_retiro?: AsignacionMaquinaDto | null;
  mantenimientos_recientes: ServicioRecienteMaquinaDto[];
}

export interface MaquinaDetalleResponse {
  ok: boolean;
  data: MaquinaDetalleDto;
}
