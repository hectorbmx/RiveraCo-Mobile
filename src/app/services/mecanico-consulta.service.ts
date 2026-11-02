import type { VehiculoAsignacionDto } from '../models/vehiculo.model';
import { Injectable } from '@angular/core';
import { ApiService } from './api';

export type RecursoMecanico = 'maquinas' | 'vehiculos' | 'servicios';
export interface ObraActivaMecanico {
  id: number; nombre: string; clave_obra?: string | null;
  estatus_nuevo?: number | string | null; ubicacion?: string | null;
}
export interface PreventivoMaquina {
  servicio_id: number | null; servicio_nombre: string; servicio_codigo?: string | null;
  servicio_tipo_actual?: string | null; servicio_tipo_siguiente?: string | null;
  servicio_tipo_codigo?: string | null; servicio_tipo_nombre?: string | null;
  estado: 'sin_datos' | 'ok' | 'proximo' | 'vencido'; label: string; color: string;
  horas_usadas: number | null; horas_restantes: number | null; intervalo_horas: number;
  porcentaje: number; proximo_horometro: number | null; proximo_fecha: string | null;
}
export interface ResumenPreventivoMaquina extends PreventivoMaquina {
  horometro_actual: number | null; servicios: PreventivoMaquina[];
}
export interface FilaMecanico {
  anio?: string | number | null; color?: string | null; serie?: string | null;
  asignado?: boolean; asignacion_actual?: VehiculoAsignacionDto | null;
  ubicacion?: string | null; asignada?: boolean; obra_activa?: ObraActivaMecanico | null;
  horometro_actual?: number | null; fecha_ultima_lectura?: string | null;
  preventivo?: ResumenPreventivoMaquina | null;
  servicio_preventivo?: { id: number; nombre: string | null; ambito?: string; intervalo_valor?: number | null; unidad?: string | null } | null;
  servicio_preventivo_tipo_id?: number | null; km_proximo_servicio?: number | null;
  id: number; nombre?: string | null; codigo?: string | null; marca?: string | null; modelo?: string | null;
  placas?: string | null; estado?: string | null; estatus?: string | null; tipo?: string | null;
  categoria_mantenimiento?: string | null; descripcion?: string | null; horometro?: number | null;
  horometro_base?: number | string | null; km_actuales?: number | null; fecha_programada?: string | null;
  costo_total?: number | null; es_propio?: boolean; orden_servicio_folio?: string | null;
  maquina?: FilaMecanico | null; vehiculo?: FilaMecanico | null;
  mecanico?: { id: number; nombre: string } | null;
}
export interface MetaMecanico { current_page: number; last_page: number; total: number; per_page: number; }
export interface ListaMecanico { ok: boolean; data: FilaMecanico[]; meta: MetaMecanico; }
export interface DetalleEquipo {
  asignacion_retiro?: DetalleEquipo['asignacion_activa'];
  asignacion_activa?: { obra_maquina_id: number; fecha_inicio: string | null;
    horometro_inicio: number | string | null; estado: string; obra: ObraActivaMecanico | null } | null;
  maquina?: FilaMecanico; vehiculo?: FilaMecanico; mantenimientos_recientes: FilaMecanico[];
}
export interface DetalleServicio extends FilaMecanico {
  fecha_inicio?: string | null; fecha_fin?: string | null; notas?: string | null;
  maquina_id?: number | null; vehiculo_id?: number | null;
  orden: { folio: string | null; generada_at: string | null };
  materiales: { disponible?: number | null; id: number; producto_id?: number | null; material_preventivo_id?: number | null; producto: string; unidad: string | null; cantidad_requerida: number; incluido: boolean; motivo_exclusion: string | null }[];
  avance_materiales: { material_id?: number | null; por_comprar?: number; producto_id?: number | null; material_preventivo_id?: number | null; producto: string; requerido: number; surtido: number; disponible: number; faltante: number; estado: string }[];
  solicitudes: { id: number; folio: string; tipo: string; estado: string; documentos_inventario: { id: number; folio: string; estado: string }[]; ordenes_compra: { id: number; folio: string; estado: string }[] }[];
  evidencias: { id: number; descripcion: string | null; url: string | null }[];
  acciones_permitidas: Record<string, boolean>;
}
@Injectable({ providedIn: 'root' })
export class MecanicoConsultaService {
  constructor(private api: ApiService) {}
  listado(recurso: RecursoMecanico, params: Record<string, string | number>) {
    return this.api.get<ListaMecanico>(`mecanico/${recurso}`, params);
  }
  detalle(recurso: RecursoMecanico, id: number) {
    return this.api.get<{ ok: boolean; data: DetalleEquipo | DetalleServicio }>(`mecanico/${recurso}/${id}`);
  }
}
