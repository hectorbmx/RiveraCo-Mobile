export interface GerencialDashboardData {
  proyectos_activos: number;
  obras_activas?: number;
  empleados_presentes: number;
  maquinaria_en_uso: number;
  inventario_stock_pct: number;
}

export interface GerencialDashboardResponse {
  ok: boolean;
  data: GerencialDashboardData;
}
