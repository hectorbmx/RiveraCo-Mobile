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

  constructor(private http: HttpClient) { }

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || `Código de error: ${error.status}`;
    }

    console.error('Error en API:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * GET request
   */
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

 getRegistros(obraMaquinaId: number): Observable<MaquinaRegistroIndexResponse> {
  return this.get<MaquinaRegistroIndexResponse>(`maquinas/${obraMaquinaId}/registros`);
}
 /**
 * Registra asistencia (entrada/salida automática)
 * Usa multipart/form-data (foto opcional según regla backend)
 */
postAsistencia(
  obraId: number,
  formData: FormData
): Observable<any> {

  const token = localStorage.getItem('auth_token');

  let headers = new HttpHeaders({
    'Accept': 'application/json'
  });

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // NO seteamos Content-Type (HttpClient lo hace solo para multipart)
  return this.http.post(
    `${this.apiUrl}/obras/${obraId}/asistencias`,
    formData,
    { headers }
  ).pipe(
    catchError(this.handleError)
  );
}
postKmLog(formData: FormData): Observable<any> {
  const token = localStorage.getItem('auth_token');

  let headers = new HttpHeaders({
    'Accept': 'application/json'
  });

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // NO seteamos Content-Type (HttpClient lo define para multipart/form-data)
  return this.http.post(
    `${this.apiUrl}/vehiculos/km-log`,
    formData,
    { headers }
  ).pipe(
    catchError(this.handleError)
  );
}


postComisiones(payload: any): Observable<any> {
  const headers = this.getHeaders(); // tu método ya arma Content-Type + Authorization

  return this.http.post(
    `${this.apiUrl}/obras/${payload.obra_id}/comisiones`,
    payload,
    { headers }
  ).pipe(
    catchError(this.handleError)
  );
}
getAsistenciasObra(obraId: number) {
  // const params: any = {};

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
// ✅ Eliminar asistencia (por id) dentro de una obra
deleteAsistenciaObra(obraId: number, asistenciaId: number, reason?: string) {
  const body: any = {};
  if (reason && reason.trim().length > 0) body.reason = reason.trim();

  return this.http.delete<any>(
    `${this.apiUrl}/obras/${obraId}/asistencias/${asistenciaId}`,
    {
      headers: this.getHeaders(),
      body, // 👈 Angular permite body en DELETE (HttpClient)
    }
  );
}

  

}