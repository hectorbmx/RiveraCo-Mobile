import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AsistenciasResponse } from '../models/asistencias';
import { MaquinaRegistroIndexResponse } from './auth';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl || 'http://localhost:8000/api/v1';
  private selectedObraStorageKey = 'selected_obra_id';

  constructor(private http: HttpClient) { }

  private selectedObraId(): number | null {
    const raw = localStorage.getItem(this.selectedObraStorageKey) ?? sessionStorage.getItem(this.selectedObraStorageKey);
    const obraId = raw ? Number(raw) : null;

    return obraId && !Number.isNaN(obraId) ? obraId : null;
  }

  private endpointUsesSelectedObra(endpoint: string): boolean {
    return endpoint.startsWith('residente/') || endpoint === 'vehiculos/km-log';
  }

  private withSelectedObraParams(endpoint: string, params?: Record<string, any>): Record<string, any> | undefined {
    const obraId = this.selectedObraId();
    const next = { ...(params ?? {}) };

    if (this.endpointUsesSelectedObra(endpoint) && obraId && !next['obra_id']) {
      next['obra_id'] = obraId;
    }

    return Object.keys(next).length > 0 ? next : undefined;
  }

  private withSelectedObraPayload<T>(endpoint: string, data: T): T {
    const obraId = this.selectedObraId();

    if (!this.endpointUsesSelectedObra(endpoint) || !obraId || data instanceof FormData || data === null || typeof data !== 'object') {
      return data;
    }

    const payload = data as Record<string, any>;

    if (payload['obra_id']) {
      return data;
    }

    return { ...payload, obra_id: obraId } as T;
  }

  private appendSelectedObra(endpoint: string, formData: FormData): void {
    const obraId = this.selectedObraId();

    if (this.endpointUsesSelectedObra(endpoint) && obraId && !formData.has('obra_id')) {
      formData.append('obra_id', String(obraId));
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private getMultipartHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Código de error: ${error.status}`;
    }

    console.error('Error en API:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    const cleanParams: Record<string, any> = {};
    const mergedParams = this.withSelectedObraParams(endpoint, params);

    if (mergedParams) {
      Object.keys(mergedParams).forEach((key) => {
        const v = (mergedParams as any)[key];
        if (v === undefined || v === null) return;
        if (typeof v === 'string' && v.trim() === '') return;
        if (v === 'undefined') return;

        cleanParams[key] = v;
      });
    }

    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders(),
      params: cleanParams
    }).pipe(catchError(this.handleError));
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, this.withSelectedObraPayload(endpoint, data), {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  postMultipart<T>(endpoint: string, formData: FormData): Observable<T> {
    this.appendSelectedObra(endpoint, formData);

    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, formData, { headers: this.getMultipartHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, this.withSelectedObraPayload(endpoint, data), {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, this.withSelectedObraPayload(endpoint, data), {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getRegistros(obraMaquinaId: number): Observable<MaquinaRegistroIndexResponse> {
    return this.get<MaquinaRegistroIndexResponse>(`maquinas/${obraMaquinaId}/registros`);
  }

  postReportarFalla(obraMaquinaId: number, motivo: string, notas?: string): Observable<any> {
    const headers = this.getHeaders();
    const payload = {
      motivo: (motivo || '').trim(),
      notas: (notas || '').trim() || null,
    };

    console.log('Enviando a:', `${this.apiUrl}/maquinas/${obraMaquinaId}/reportar-falla`);

    return this.http.post(
      `${this.apiUrl}/maquinas/${obraMaquinaId}/reportar-falla`,
      payload,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  postAsistencia(obraId: number, formData: FormData): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/obras/${obraId}/asistencias`,
      formData,
      { headers: this.getMultipartHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  postKmLog(formData: FormData): Observable<any> {
    this.appendSelectedObra('vehiculos/km-log', formData);

    return this.http.post(
      `${this.apiUrl}/vehiculos/km-log`,
      formData,
      { headers: this.getMultipartHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  postComisiones(payload: any): Observable<any> {
    const headers = this.getHeaders();

    return this.http.post(
      `${this.apiUrl}/obras/${payload.obra_id}/comisiones`,
      payload,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getResidenteComisiones(): Observable<any> {
    return this.get<any>('residente/comisiones');
  }

  getResidenteComision(comisionId: number): Observable<any> {
    return this.get<any>(`residente/comisiones/${comisionId}`);
  }

  postResidenteComision(payload: any): Observable<any> {
    return this.post<any>('residente/comisiones', payload);
  }

  patchResidenteComisionEtapa(comisionId: number, etapa: string, payload: any): Observable<any> {
    return this.patch<any>(`residente/comisiones/${comisionId}/etapas/${etapa}`, payload);
  }

  postResidenteComisionEtapaFoto(comisionId: number, etapa: string, formData: FormData): Observable<any> {
    return this.postMultipart<any>(`residente/comisiones/${comisionId}/etapas/${etapa}/fotos`, formData);
  }

  getAsistenciasObra(obraId: number) {
    return this.http.get<AsistenciasResponse>(
      `${this.apiUrl}/obras/${obraId}/asistencias`,
      { headers: this.getHeaders() }
    );
  }

  getAsistenciasEmpleadoObra(obraId: number, empleadoId: number) {
    return this.http.get<any>(
      `${this.apiUrl}/obras/${obraId}/empleados/${empleadoId}/asistencias`,
      { headers: this.getHeaders() }
    );
  }

  deleteAsistenciaObra(obraId: number, asistenciaId: number, reason?: string) {
    const body: any = {};
    if (reason && reason.trim().length > 0) body.reason = reason.trim();

    return this.http.delete<any>(
      `${this.apiUrl}/obras/${obraId}/asistencias/${asistenciaId}`,
      {
        headers: this.getHeaders(),
        body,
      }
    );
  }
}
