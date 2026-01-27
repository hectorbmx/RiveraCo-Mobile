export interface AsistenciasResponse {
  obra_id: number;
  from: string | null;
  to: string | null;
  data: AsistenciaDiaEmpleado[];
}

export interface AsistenciaDiaEmpleado {
  empleado: Empleado;
  checked_date: string; // YYYY-MM-DD
  entrada: AsistenciaItem | null;
  salida: AsistenciaItem | null;
}

export interface AsistenciaItem {
  id: number;
  hora: string; // HH:mm
  photo_path: string | null;
  photo_url: string | null;
}

export interface Empleado {
  id_Empleado: number;
  Nombre: string;
  Apellidos: string;
  Puesto?: string | null;
  puesto_base?: string | null;
  foto?: string | null;
}
