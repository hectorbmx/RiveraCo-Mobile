import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { DetalleServicio, FilaMecanico, MetaMecanico } from './mecanico-consulta.service';

export interface TipoPreventivo {
  id: number; nombre: string; ambito: string;
  intervalo_valor?: number | null; unidad?: 'horas' | 'km' | null;
}
export interface MaterialSugerido { id: number; producto_id: number; producto: string; cantidad: number; unidad: string | null; sku?: string | null; disponible?: number | null; faltante?: number | null; }
export interface CatalogosMecanico {
  servicios_preventivos: { maquinaria: TipoPreventivo[]; vehiculo: TipoPreventivo[] };
  lectura_sugerida: { campo: string; valor: number | null; unidad: string } | null;
  materiales_por_servicio: Record<string, MaterialSugerido[]>; avisos: string[];
  capacidades: { inventario_giralda: boolean; plantilla_materiales_vehiculo: boolean; tipos_vehiculo_configurados: boolean };
}
export interface BorradorMecanico {
  maquina_id: number | null; vehiculo_id: number | null; categoria_mantenimiento: string;
  servicio_preventivo_tipo_id: number; descripcion: string | null; fecha_programada: string;
  horometro: number | null; km_actuales: number | null; km_proximo_servicio: number | null;
}
export interface ProductoMecanico {
  id: number; nombre: string; sku: string | null; unidad: string | null; unidad_stock: string | null;
  tiene_registro_stock: boolean; stock: { stock_actual: number; stock_reservado: number; disponible: number };
}
export type CierreMecanico = { fecha_fin: string; notas: string | null } &
  ({ horometro: number; km_actuales?: never } | { km_actuales: number; horometro?: never });
// datetime-local se interpreta en la zona del proyecto, nunca en la del teléfono.
export function fechaEjecucionMexico(valor: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;
  const fecha = new Date(`${valor}:00Z`);
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 16) === valor ? `${valor}:00` : null;
}
export interface RespuestaServicio { ok: boolean; data: DetalleServicio; solicitud_id?: number; }
export function mensajeOperacion(error: any): string {
  const mensajes = Object.values(error?.error?.errors ?? {}).reduce<string[]>((result, valor) =>
    result.concat(Array.isArray(valor) ? valor.map(String) : [String(valor)]), []);
  return mensajes.length ? mensajes.join(' ') : error?.message || 'No se pudo completar la operación.';
}
export function fechaMexico(iso: string | null | undefined): string {
  if (!iso) return '';
  if (!Number.isFinite(new Date(iso).getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)).replace(' ', 'T');
}
@Injectable({ providedIn: 'root' })
export class MecanicoOperacionService {
  constructor(private api: ApiService) {}
  catalogos(equipo?: { maquina_id?: number; vehiculo_id?: number }) {
    return this.api.get<{ ok: boolean; data: CatalogosMecanico }>('mecanico/servicios/catalogos', equipo);
  }
  crear(payload: BorradorMecanico) { return this.api.post<{ ok: boolean; data: FilaMecanico }>('mecanico/servicios', payload); }
  editar(id: number, payload: BorradorMecanico) { return this.api.patch<{ ok: boolean; data: FilaMecanico }>(`mecanico/servicios/${id}`, payload); }
  generarOrden(id: number) { return this.api.post<RespuestaServicio>(`mecanico/servicios/${id}/generar-orden`, {}); }
  ajustarMateriales(id: number, materiales: { id: number; incluido: boolean; motivo_exclusion: string | null }[]) {
    return this.api.patch<RespuestaServicio>(`mecanico/servicios/${id}/materiales`, { materiales });
  }
  solicitar(id: number, tipo: 'almacen' | 'compra') { return this.api.post<RespuestaServicio>(`mecanico/servicios/${id}/abastecimientos`, { tipo }); }
  iniciar(id: number, fechaInicio: string) {
    return this.api.post<RespuestaServicio>(`mecanico/servicios/${id}/iniciar`, { fecha_inicio: fechaInicio });
  }
  completar(id: number, payload: CierreMecanico) {
    return this.api.post<RespuestaServicio>(`mecanico/servicios/${id}/completar`, payload);
  }
  evidencias(id: number, fotos: { archivo: File; descripcion: string }[]) {
    const data = new FormData();
    fotos.forEach((foto, index) => { data.append(`fotos[${index}]`, foto.archivo, foto.archivo.name); data.append(`foto_descripciones[${index}]`, foto.descripcion); });
    return this.api.postMultipart<RespuestaServicio>(`mecanico/servicios/${id}/evidencias`, data);
  }
  productos(page: number, q: string, conExistencia: boolean) {
    return this.api.get<{ ok: boolean; data: ProductoMecanico[]; meta: MetaMecanico }>('mecanico/inventario/productos',
      { page, q, per_page: 25, con_existencia: conExistencia ? 1 : 0 });
  }
}
