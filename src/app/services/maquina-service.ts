import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api'; // Importamos el genérico
import { MaquinaRegistroIndexResponse } from './auth';

@Injectable({
  providedIn: 'root'
})
export class MaquinaService {

  constructor(private api: ApiService) {}

  /**
   * Obtiene el historial y datos de la asignación
   */
  getRegistros(obraMaquinaId: number): Observable<MaquinaRegistroIndexResponse> {
    return this.api.get<MaquinaRegistroIndexResponse>(`maquinas/${obraMaquinaId}/registros`);
  }

  /**
   * Registra un nuevo horómetro (Guardar Registro)
   */
  postRegistro(obraMaquinaId: number, payload: { horometro_fin: number, notas?: string | null }): Observable<any> {
    return this.api.post(`maquinas/${obraMaquinaId}/registros`, payload);
  }

  /**
   * Reporta una falla técnica
   */
  postReportarFalla(obraMaquinaId: number, motivo: string, notas?: string): Observable<any> {
    const payload = {
      motivo: motivo.trim(),
      notas: notas?.trim() || null,
    };
    return this.api.post(`maquinas/${obraMaquinaId}/reportar-falla`, payload);
  }
/**
 * Método genérico para transiciones de estado
 * Ahora acepta 4 argumentos: id, estado, motivo y notas
 */
postCambiarEstado(obraMaquinaId: number, estado: string, motivo: string, notas?: string | null): Observable<any> {
  const payload = {
    estado: estado,
    motivo: motivo.trim(),
    notas: notas?.trim() || null // Agregamos las notas al payload
  };
  
  return this.api.post(`maquinas/${obraMaquinaId}/actualizar-estado`, payload);
}
}