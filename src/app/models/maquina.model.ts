// src/app/models/maquina.model.ts

export interface MaquinaListItemDto {
  id: number;
  nombre: string;
  tipo: string | null;
  marca: string | null;
  modelo: string;
  placas: string;
  horometro_base: string;
  estado: 'operativa' | 'mantenimiento' | 'baja'; // Basado en estados comunes
  asignada: boolean;
  obra_activa: {
    id: number;
    nombre: string;
    clave_obra: string;
    estatus_nuevo: number;
  } | null;
}

export interface MaquinasResponse {
  ok: boolean;
  data: {
    current_page: number;
    data: MaquinaListItemDto[];
    total: number;
    last_page: number;
  };
}