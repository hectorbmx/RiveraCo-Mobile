import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { OpcionesHorasMaquina } from './mecanico-maquina-horas.service';

export type UbicacionMaquina = 'en_obra' | 'en_camino' | 'en_reparacion' | 'en_patio';
export const UBICACIONES_MAQUINA: UbicacionMaquina[] = ['en_obra', 'en_camino', 'en_reparacion', 'en_patio'];
export interface ContextoUbicacionMaquina {
  asignacion_esperada_id: number | null; horometro_esperado: string | number | null;
  ubicacion_esperada: UbicacionMaquina | null; movimiento_esperado_id: number | null;
}
export interface OpcionesUbicacionMaquina extends OpcionesHorasMaquina {
  contexto_ubicacion: ContextoUbicacionMaquina; ubicaciones_permitidas: UbicacionMaquina[];
}
export type PayloadUbicacionMaquina = ContextoUbicacionMaquina & { ubicacion: UbicacionMaquina; motivo: string; notas: string | null };
export interface PendienteUbicacionMaquina { payload: PayloadUbicacionMaquina; obra: string | null; }
export interface ResultadoUbicacionMaquina extends OpcionesUbicacionMaquina {
  operacion: { id: number; movimiento_id: number; tipo: 'cambio_ubicacion'; asignacion_id: number | null;
    obra_id: number | null; ubicacion_anterior: UbicacionMaquina | null; ubicacion_nueva: UbicacionMaquina;
    motivo: string; fecha_evento: string; reutilizada: boolean };
}
@Injectable({ providedIn: 'root' })
export class MecanicoMaquinaUbicacionService {
  private memoria = new Map<string, PendienteUbicacionMaquina>();
  constructor(private api: ApiService) {}
  opciones(id: number) { return this.api.get<{ ok: boolean; data: OpcionesUbicacionMaquina }>(`mecanico/maquinas/${id}/opciones-operacion`); }
  guardar(id: number, payload: PayloadUbicacionMaquina) {
    return this.api.patch<{ ok: boolean; data: ResultadoUbicacionMaquina }>(`mecanico/maquinas/${id}/ubicacion`, { ...payload });
  }
  pendiente(usuario: number, maquina: number): PendienteUbicacionMaquina | null {
    const clave = this.clave(usuario, maquina); let dato = this.memoria.get(clave);
    if (!dato) {
      try {
        const raw = sessionStorage.getItem(clave); const parsed = raw ? JSON.parse(raw) : null; const p = parsed?.payload;
        const idValido = (v: unknown) => v === null || (typeof v === 'number' && Number.isInteger(v) && v > 0);
        if (p && idValido(p.asignacion_esperada_id) && idValido(p.movimiento_esperado_id)
          && (p.horometro_esperado === null || (typeof p.horometro_esperado === 'number' && Number.isFinite(p.horometro_esperado))
            || (typeof p.horometro_esperado === 'string' && /^\d+(\.\d{1,2})?$/.test(p.horometro_esperado)))
          && (p.ubicacion_esperada === null || UBICACIONES_MAQUINA.includes(p.ubicacion_esperada))
          && UBICACIONES_MAQUINA.includes(p.ubicacion) && typeof p.motivo === 'string'
          && (p.notas === null || typeof p.notas === 'string') && (parsed.obra === null || typeof parsed.obra === 'string')) dato = parsed;
      } catch { /* Recuperación en memoria si el navegador restringe el almacenamiento. */ }
    }
    if (dato) this.memoria.set(clave, this.copiar(dato));
    return dato ? this.copiar(dato) : null;
  }
  recordar(usuario: number, maquina: number, dato: PendienteUbicacionMaquina) {
    const clave = this.clave(usuario, maquina); const copia = this.copiar(dato); this.memoria.set(clave, copia);
    try { sessionStorage.setItem(clave, JSON.stringify(copia)); } catch { /* Respaldo en memoria. */ }
  }
  olvidar(usuario: number, maquina: number) {
    const clave = this.clave(usuario, maquina); this.memoria.delete(clave);
    try { sessionStorage.removeItem(clave); } catch { /* Almacenamiento restringido. */ }
  }
  private copiar(dato: PendienteUbicacionMaquina) { return { payload: { ...dato.payload }, obra: dato.obra }; }
  private clave(usuario: number, maquina: number) { return `mecanico.ubicacion.pendiente.v1.${usuario}.${maquina}`; }
}
