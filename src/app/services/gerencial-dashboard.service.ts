import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GerencialDashboardResponse } from 'src/app/models/gerencial/dashboard.dto';
import { ApiService } from './api'; // ajusta ruta

@Injectable({ providedIn: 'root' })
export class GerencialDashboardService {
  constructor(private api: ApiService) {}

  getDashboard(): Observable<GerencialDashboardResponse> {
    return this.api.get<GerencialDashboardResponse>('gerencial/dashboard');
  }
}
