import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string | null;
  email: string;
}

export interface AppInfo {
  user_app_id: number;
  empleado_id: number;
  is_active: boolean;
}

export interface ObraContexto {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  nombre: string;
  clave_obra: string;
  ubicacion: string | null;
  estatus_nuevo: number;
  fecha_inicio_programada: string | null; // viene como "YYYY-MM-DD"
  fecha_inicio_real: string | null;
  pilas_total_programado?: number;

}

export interface RolInfo {
  id: number;
  rol_key: string | null;
  nombre: string | null;
}

export interface EmpleadoInfo {
  id_Empleado: number;
  nombre: string;
  telefono: string | null;
}

export interface EmpleadoAsignado {
  obra_empleado_id: number;
  empleado_id: number;
  rol_id: number;
  rol: RolInfo | null;
  empleado: EmpleadoInfo | null;
}
export interface PilaDTO {
  id: number;
  obra_id: number;
  numero_pila?: number | string | null; // depende tu DB
  tipo?: string | null;
  diametro?: number | null;
  profundidad?: number | null;
  estatus?: string | number | null;
}

export interface MaquinaInfo {
  id: number;
  nombre: string | null;
}


export interface MaquinaActiva {
  obra_maquina_id: number;
  maquina_id: number;
  fecha_inicio: string | null;
  horometro_inicio: number | null;
  estado: string | null;
  maquina: MaquinaInfo | null;
}
export interface VehiculoDTO {
  id: number;
  marca: string | null;
  modelo: string | null;
  placas: string | null;
  anio?: number | null;
  color?: string | null;
  tipo?: string | null;
  estatus?: string | null;
}

export interface VehiculoAsignacionDTO {
  vehiculo_id: number;              // FK del pivot
  fecha_asignacion: string | null;
  fecha_fin: string | null;
  notas: string | null;
  vehiculo: VehiculoDTO | null;     // objeto del catálogo
}


export interface Contexto {
  obra: ObraContexto;
  empleados: EmpleadoAsignado[];
  maquina: MaquinaActiva | null;
  vehiculo: VehiculoAsignacionDTO | null; // ✅ ESTA es la llave real
  pilas: PilaDTO[];
  
}

export interface LoginResponse {
  ok: boolean;
  token: string;
  user: User;
  app: AppInfo;
  contexto: Contexto;
  message?: string;
}

export interface MeResponse {
  ok: boolean;
  user: User;
  app: AppInfo;
  contexto: Contexto;
  message?: string;
}

export interface MaquinaRegistroIndexResponse {
  ok: boolean;
  asignacion: {
    obra_maquina_id: number;
    obra_id: number;
    maquina_id: number;
    estado: string;
    fecha_inicio: string | null;
    horometro_inicio: number | null;
    maquina: { id: number; nombre: string | null } | null;
  };
  horometro_sugerido: number;
  registros: Array<{
    id: number;
    inicio: string;
    fin: string;
    horometro_inicio: string;
    horometro_fin: string;
    horas: string;
    notas: string | null;
    created_at: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated: Observable<boolean>;

  // Opcional pero recomendable para usar contexto globalmente
  private contextoSubject = new BehaviorSubject<Contexto | null>(null);
  public contexto$ = this.contextoSubject.asObservable();

  private appInfoSubject = new BehaviorSubject<AppInfo | null>(null);
  public appInfo$ = this.appInfoSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('current_user');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();

    const token = localStorage.getItem('auth_token');
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(!!token);
    this.isAuthenticated = this.isAuthenticatedSubject.asObservable();

    // Rehidratar contexto/app si ya existen
    const storedContexto = localStorage.getItem('app_contexto');
    if (storedContexto) this.contextoSubject.next(JSON.parse(storedContexto));

    const storedAppInfo = localStorage.getItem('app_info');
    if (storedAppInfo) this.appInfoSubject.next(JSON.parse(storedAppInfo));
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticatedValue(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  public get contextoValue(): Contexto | null {
    return this.contextoSubject.value;
  }

  public get appInfoValue(): AppInfo | null {
    return this.appInfoSubject.value;
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('login', credentials).pipe(
      tap(response => {
        localStorage.setItem('auth_token', response.token);

        localStorage.setItem('current_user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);

        localStorage.setItem('app_info', JSON.stringify(response.app));
        this.appInfoSubject.next(response.app);

        localStorage.setItem('app_contexto', JSON.stringify(response.contexto));
        this.contextoSubject.next(response.contexto);

        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  getMe(): Observable<MeResponse> {
    return this.apiService.get<MeResponse>('me').pipe(
      tap(res => {
        localStorage.setItem('current_user', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);

        localStorage.setItem('app_info', JSON.stringify(res.app));
        this.appInfoSubject.next(res.app);

        localStorage.setItem('app_contexto', JSON.stringify(res.contexto));
        this.contextoSubject.next(res.contexto);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('app_info');
    localStorage.removeItem('app_contexto');

    this.currentUserSubject.next(null);
    this.appInfoSubject.next(null);
    this.contextoSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    this.router.navigate(['/login']);
  }

  hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  
}
