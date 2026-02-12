import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ObrasIndexResponse } from 'src/app/models/gerencial/obras.dto';
import { ApiService } from './api'; // ajusta la ruta

export interface ObrasIndexParams {
  page?: number;
  per_page?: number;
  q?: string;
  estatus?: number;
}

@Injectable({ providedIn: 'root' })
export class GerencialObrasService {
  constructor(private api: ApiService) {}

  index(params?: ObrasIndexParams): Observable<ObrasIndexResponse> {
    return this.api.get<ObrasIndexResponse>('gerencial/obras', params as any);
  }
    show(id: number): Observable<any> {
    return this.api.get<any>(`gerencial/obras/${id}`);
  }
 maquinaRegistros(maquinaId: number, page: number = 1) {
  return this.api.get<any>(
    `gerencial/maquinas/${maquinaId}/registros`,
    { page }
  );
}

}
