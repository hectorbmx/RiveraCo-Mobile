import { Injectable } from '@angular/core';
import { ApiService } from './api';
import { ObraActivaMecanico } from './mecanico-consulta.service';
import { ContextoHorasMaquina, MecanicoMaquinaHorasService, OpcionesHorasMaquina } from './mecanico-maquina-horas.service';

export type AccionAsignacionMaquina = 'asignar' | 'retirar';
export interface SeleccionAsignacionMaquina { maquinaId: number; accion: AccionAsignacionMaquina; }
export type PayloadAsignacionMaquina = ContextoHorasMaquina & { obra_id: number; fecha_inicio: string; horometro_inicio: number; notas: string | null };
export type PayloadRetiroMaquina = ContextoHorasMaquina & { asignacion_esperada_id: number; fecha_fin: string };
export type PendienteAsignacionMaquina = (
  { accion: 'asignar'; payload: PayloadAsignacionMaquina } | { accion: 'retirar'; payload: PayloadRetiroMaquina }
) & { obra: ObraActivaMecanico | null };
export interface ResultadoAsignacionMaquina extends OpcionesHorasMaquina {
  operacion: { id: number; movimiento_id: number; tipo: 'asignacion_obra' | 'retiro_obra'; asignacion_id: number;
    obra_id: number; ubicacion_anterior: string | null; ubicacion_nueva: string; reutilizada: boolean };
}
@Injectable({ providedIn: 'root' })
export class MecanicoMaquinaAsignacionService {
  private memoria = new Map<string, PendienteAsignacionMaquina>();
  constructor(private api: ApiService, private horas: MecanicoMaquinaHorasService) {}
  opciones(id: number, params: Record<string, string | number> = {}) { return this.horas.opciones(id, params); }
  guardar(id: number, operacion: PendienteAsignacionMaquina) {
    const ruta = operacion.accion === 'asignar' ? 'asignar-obra' : 'baja-obra';
    return this.api.post<{ ok: boolean; data: ResultadoAsignacionMaquina }>(`mecanico/maquinas/${id}/${ruta}`, operacion.payload);
  }
  pendiente(usuario: number, maquina: number): PendienteAsignacionMaquina | null {
    const clave = this.clave(usuario, maquina);
    let dato = this.memoria.get(clave);
    if (!dato) {
      try {
        const raw = sessionStorage.getItem(clave);
        const parsed = raw ? JSON.parse(raw) : null;
        const p = parsed?.payload;
        if (p && (p.horometro_esperado === null || Number.isFinite(p.horometro_esperado))
          && (parsed.accion === 'asignar'
            ? p.asignacion_esperada_id === null && Number.isInteger(p.obra_id) && Number.isFinite(p.horometro_inicio)
              && typeof p.fecha_inicio === 'string' && (p.notas === null || typeof p.notas === 'string')
            : parsed.accion === 'retirar' && Number.isInteger(p.asignacion_esperada_id) && typeof p.fecha_fin === 'string')
          && (parsed.obra == null || (Number.isInteger(parsed.obra.id) && typeof parsed.obra.nombre === 'string'))) dato = parsed;
      } catch { /* Mantener recuperación en memoria cuando el almacenamiento esté restringido. */ }
    }
    if (dato) this.memoria.set(clave, this.copiar(dato));
    return dato ? this.copiar(dato) : null;
  }
  recordar(usuario: number, maquina: number, dato: PendienteAsignacionMaquina) {
    const clave = this.clave(usuario, maquina); const copia = this.copiar(dato); this.memoria.set(clave, copia);
    try { sessionStorage.setItem(clave, JSON.stringify(copia)); } catch { /* Respaldo en memoria. */ }
  }
  olvidar(usuario: number, maquina: number) {
    const clave = this.clave(usuario, maquina); this.memoria.delete(clave);
    try { sessionStorage.removeItem(clave); } catch { /* El navegador puede restringir almacenamiento. */ }
  }
  private copiar(dato: PendienteAsignacionMaquina): PendienteAsignacionMaquina {
    return { ...dato, payload: { ...dato.payload }, obra: dato.obra ? { ...dato.obra } : null } as PendienteAsignacionMaquina;
  }
  private clave(usuario: number, maquina: number) { return `mecanico.asignacion.pendiente.v1.${usuario}.${maquina}`; }
}
