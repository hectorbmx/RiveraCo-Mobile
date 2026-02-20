export interface AreaDto {
  id: number;
  nombre: string;
}

export interface EmpleadoListItemDto {
  id: number;
  nombre_completo: string; // El backend manda 'nombre_completo', no 'nombre'
  puesto: string | null;
  estatus: number;
  sueldo: number;
  sueldo_real: number;
  complemento: number;
  area: {
    id: number;
    nombre: string;
  } | null;
  foto_url: string | null;
  esta_asignado: boolean; // El flag de control
  obra_actual: { // El objeto con la info de la obra
    id: number;
    nombre: string;
    clave_obra: string;
    puesto_en_obra: string | null;
  } | null;
  es_de_esta_obra: boolean | null;
}

export interface PaginatedMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  
}

export interface ApiOk<T> {
  ok: boolean;
  data: T;
  meta?: PaginatedMeta;
}
export interface LaravelPaginator<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
  // (puedes añadir más campos luego si los ocupas)
}

export type EmpleadoStatusFilter = 'activos' | 'baja' | 'todos';
