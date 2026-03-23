import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';
export interface EmployeeSummary {
  ok: boolean;
  employee: { id: number; name: string; enroll_id: number; };
  kpis: { worked_days: number; total_hours: number; avg_entry: string; };
  data: Array<{
    date: string;
    day_name: string;
    entry_at: string;
    exit_at: string | null;
    hours: number;
    logs: any[];
  }>;
}
@Injectable({
  providedIn: 'root'
})


export class AttendanceService {

  constructor(private api: ApiService) {}

  getLogs(filters: any = {}): Observable<any> {
    return this.api.get('attendance/logs', filters);
  }

  getEmployeeSummary(employeeId: number, filters: any = {}): Observable<any> {
    return this.api.get(`attendance/employees/${employeeId}/summary`, filters);
  }
}