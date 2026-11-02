import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { DetalleEquipo, FilaMecanico, MetaMecanico, ObraActivaMecanico } from './mecanico-consulta.service';
import { fechaEjecucionMexico, fechaMexico } from './mecanico-operacion.service';

export interface ContextoHorasMaquina { asignacion_esperada_id: number | null; horometro_esperado: number | null; }
export interface OpcionesHorasMaquina {
  maquina: FilaMecanico; asignacion_activa: DetalleEquipo['asignacion_activa']; contexto: ContextoHorasMaquina;
  acciones_permitidas: { registrar_horas: boolean; ajustar_horometro: boolean; asignar_obra: boolean; retirar_obra: boolean; cambiar_ubicacion: boolean };
  obras?: ObraActivaMecanico[];
  asignacion_retiro?: DetalleEquipo['asignacion_activa']; contexto_retiro?: ContextoHorasMaquina;
}
export type CapturaHorasMaquina = ContextoHorasMaquina & { horometro_fin: number; notas: string | null } &
  ({ inicio: string; fin: string; fecha_registro?: never; obra_id?: never } |
   { fecha_registro: string; obra_id: number | null; inicio?: never; fin?: never });
export interface ResultadoHorasMaquina extends OpcionesHorasMaquina {
  operacion: { tipo: 'registro_horas' | 'ajuste_horometro'; id: number; asignacion_id: number | null;
    horometro_anterior: number; horometro_nuevo: number; diferencia: number; reutilizada: boolean };
}
export interface RespuestaOpcionesHoras { ok: boolean; data: OpcionesHorasMaquina; meta?: MetaMecanico; }

export function fechaHoraMaquinaMexico(valor: string): string | null {
  const civil = fechaEjecucionMexico(valor);
  if (!civil || valor.slice(0, 4) < '1000') return null;
  // Respetar México incluso si el teléfono usa otra zona; incluye fechas históricas con horario de verano.
  for (const offset of ['-06:00', '-05:00']) {
    const candidato = `${civil}${offset}`;
    if (fechaMexico(candidato) === valor) return candidato;
  }
  return null;
}
@Injectable({ providedIn: 'root' })
export class MecanicoMaquinaHorasService {
  private memoria = new Map<string, CapturaHorasMaquina>();
  constructor(private api: ApiService) {}
  opciones(id: number, params: Record<string, string | number> = {}) {
    return this.api.get<RespuestaOpcionesHoras>(`mecanico/maquinas/${id}/opciones-operacion`, params);
  }
  guardar(id: number, payload: CapturaHorasMaquina) {
    return this.api.post<{ ok: boolean; data: ResultadoHorasMaquina }>(`mecanico/maquinas/${id}/horas`, payload);
  }
  pendiente(usuario: number, maquina: number): CapturaHorasMaquina | null {
    const clave = this.clave(usuario, maquina);
    let dato = this.memoria.get(clave);
    if (!dato) {
      try {
        const raw = sessionStorage.getItem(clave);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && Number.isFinite(parsed.horometro_fin)
            && (parsed.horometro_esperado === null || Number.isFinite(parsed.horometro_esperado))
            && (parsed.notas === null || typeof parsed.notas === 'string')
            && (parsed.asignacion_esperada_id === null
              ? typeof parsed.fecha_registro === 'string' && (parsed.obra_id === null || Number.isInteger(parsed.obra_id))
              : Number.isInteger(parsed.asignacion_esperada_id) && typeof parsed.inicio === 'string' && typeof parsed.fin === 'string')) dato = parsed;
        }
      } catch { /* Mantener disponible la recuperación en memoria si el navegador restringe almacenamiento. */ }
    }
    return dato ? { ...dato } : null;
  }
  recordar(usuario: number, maquina: number, payload: CapturaHorasMaquina) {
    const clave = this.clave(usuario, maquina);
    const copia = { ...payload }; this.memoria.set(clave, copia);
    try { sessionStorage.setItem(clave, JSON.stringify(copia)); } catch { /* Respaldo en memoria durante esta ejecución. */ }
  }
  olvidar(usuario: number, maquina: number) {
    const clave = this.clave(usuario, maquina); this.memoria.delete(clave);
    try { sessionStorage.removeItem(clave); } catch { /* El almacenamiento puede estar restringido. */ }
  }
  private clave(usuario: number, maquina: number) { return `mecanico.horas.pendiente.v1.${usuario}.${maquina}`; }
}
