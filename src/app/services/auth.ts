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
  cantidad_programada?: number | null;
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
export interface Authz {
  roles: string[];
  permissions: string[];
}

// export interface LoginResponse {
//   ok: boolean;
//   token: string;
//   user: User;
//   app: AppInfo;
//   contexto: Contexto;
//   message?: string;
// }
export interface LoginResponse {
  ok: boolean;
  token: string;
  user: User;
  app: AppInfo;
  contexto: Contexto | null;
  authz: Authz;              // ✅
  gerencial?: any | null;    // opcional si quieres guardarlo luego
  message?: string;
}

export interface MeResponse {
  ok: boolean;
  user: User;
  app: AppInfo;
  contexto: Contexto | null;
  authz: Authz;              // ✅
  gerencial?: any | null;
  message?: string;
}

export interface MaquinaRegistroIndexResponse {
  ok: boolean;
  asignacion: {
    obra_maquina_id: number;
    obra_id: number;
    maquina_id: number;

    // estado de asignación (obra_maquina)
    estado: string;

    fecha_inicio: string | null;
    horometro_inicio: number | null;

    // 👇 aquí agregamos estado real de la máquina
    maquina: {
      id: number;
      nombre: string | null;
      estado: string; // 'operativa' | 'fuera_servicio' | 'en_reparacion' | 'baja_definitiva'
    } | null;
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

  private storageKeyToken = 'auth_token';
  private storageKeyUser = 'current_user';
  private storageKeyApp = 'app_info';
  private storageKeyContexto = 'app_contexto';
  private storageKeyAuthz = 'authz';
  private storageKeyRemember = 'remember_me';

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated: Observable<boolean>;

  // Opcional pero recomendable para usar contexto globalmente
  private contextoSubject = new BehaviorSubject<Contexto | null>(null);
  public contexto$ = this.contextoSubject.asObservable();

  private appInfoSubject = new BehaviorSubject<AppInfo | null>(null);
  public appInfo$ = this.appInfoSubject.asObservable();

  private authzSubject = new BehaviorSubject<Authz | null>(null);
  public authz$ = this.authzSubject.asObservable();


  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    const storedUser =
      localStorage.getItem(this.storageKeyUser) ?? sessionStorage.getItem(this.storageKeyUser);

    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();

    // const token = localStorage.getItem('auth_token');
    const token = localStorage.getItem(this.storageKeyToken) ?? sessionStorage.getItem(this.storageKeyToken);

    

    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(!!token);
    this.isAuthenticated = this.isAuthenticatedSubject.asObservable();

    // Rehidratar contexto/app si ya existen
    const storedContexto =
      localStorage.getItem(this.storageKeyContexto) ?? sessionStorage.getItem(this.storageKeyContexto);
    if (storedContexto) this.contextoSubject.next(JSON.parse(storedContexto));

    const storedAppInfo =
      localStorage.getItem(this.storageKeyApp) ?? sessionStorage.getItem(this.storageKeyApp);
    if (storedAppInfo) this.appInfoSubject.next(JSON.parse(storedAppInfo));

   const storedAuthz =
      localStorage.getItem(this.storageKeyAuthz) ?? sessionStorage.getItem(this.storageKeyAuthz);
    if (storedAuthz) this.authzSubject.next(JSON.parse(storedAuthz));

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

  login(credentials: LoginCredentials, rememberMe: boolean): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('login', credentials).pipe(
      tap(response => {
       this.setRemember(rememberMe);
        const storage = rememberMe ? localStorage : sessionStorage;

        storage.setItem(this.storageKeyToken, response.token);

        storage.setItem(this.storageKeyUser, JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);

        storage.setItem(this.storageKeyApp, JSON.stringify(response.app));
        this.appInfoSubject.next(response.app);

        storage.setItem(this.storageKeyContexto, JSON.stringify(response.contexto));
        this.contextoSubject.next(response.contexto);

        storage.setItem(this.storageKeyAuthz, JSON.stringify(response.authz));
        this.authzSubject.next(response.authz);

        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  getMe(): Observable<MeResponse> {
    return this.apiService.get<MeResponse>('me').pipe(
      tap(res => {

        const storage = this.getStorage();
       
        storage.setItem(this.storageKeyUser, JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
        
        storage.setItem(this.storageKeyApp, JSON.stringify(res.app));
        this.appInfoSubject.next(res.app);

        storage.setItem(this.storageKeyContexto, JSON.stringify(res.contexto));
        this.contextoSubject.next(res.contexto);

        storage.setItem(this.storageKeyAuthz, JSON.stringify(res.authz));
        this.authzSubject.next(res.authz);

        // localStorage.setItem('current_user', JSON.stringify(res.user));
        // this.currentUserSubject.next(res.user);
        // localStorage.setItem('authz', JSON.stringify(res.authz));
        // this.authzSubject.next(res.authz);

        // localStorage.setItem('app_info', JSON.stringify(res.app));
        // this.appInfoSubject.next(res.app);

        // localStorage.setItem('app_contexto', JSON.stringify(res.contexto));
        // this.contextoSubject.next(res.contexto);
      })
    );
  }

    logout(): void {
    // limpia ambos
    [localStorage, sessionStorage].forEach(s => {
      s.removeItem(this.storageKeyToken);
      s.removeItem(this.storageKeyUser);
      s.removeItem(this.storageKeyApp);
      s.removeItem(this.storageKeyContexto);
      s.removeItem(this.storageKeyAuthz);
    });

    // opcional: si quieres que al logout también se olvide el remember
    localStorage.removeItem(this.storageKeyRemember);

    this.currentUserSubject.next(null);
    this.appInfoSubject.next(null);
    this.contextoSubject.next(null);
    this.authzSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    this.router.navigate(['/login']);
  }


  hasToken(): boolean {
    return !!(localStorage.getItem(this.storageKeyToken) ?? sessionStorage.getItem(this.storageKeyToken));
  }

  getToken(): string | null {
    return localStorage.getItem(this.storageKeyToken) ?? sessionStorage.getItem(this.storageKeyToken);
  }
  authzValue(): Authz | null {
    return this.authzSubject.value;
  }

    hasPermission(permission: string): boolean {
    const authz = this.authzSubject.value;
    return !!authz?.permissions?.includes(permission);
  }
  isGerencial(): boolean {
    return this.hasPermission('app.gerencial.access');
  }
private getStorage(): Storage {
    // Si el usuario eligió "recordarme", usamos localStorage; si no, sessionStorage
    const remember = localStorage.getItem(this.storageKeyRemember) === '1';
    return remember ? localStorage : sessionStorage;
  }

  private setRemember(remember: boolean) {
    // guardamos esta preferencia en localStorage para decidir en arranque
    localStorage.setItem(this.storageKeyRemember, remember ? '1' : '0');
  }
}
