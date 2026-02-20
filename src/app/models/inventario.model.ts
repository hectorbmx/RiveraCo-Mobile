// src/app/models/inventario.model.ts

export interface LaravelPaginatorMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiOk<T> {
  ok: true;
  data: T;
  meta?: LaravelPaginatorMeta;
}

export interface AlmacenDto {
  id: number | null;
  nombre: string | null;
}

export interface ProductoDto {
  id: number;
  nombre: string | null;
  sku: string | null;
}

export interface StockDto {
  stock_actual: number;
  stock_minimo: number | null;
  stock_reservado: number;
  costo_promedio: number;
  valor_total: number;
}

/**
 * Row que te regresa /inventario/stock (por lo que pegaste)
 */
export interface InventarioStockRowDto {
  id: number;
  almacen: AlmacenDto;
  producto: ProductoDto;
  stock: StockDto;
}

export interface InventarioStockResponseDto {
  ok: true;
  data: InventarioStockRowDto[];
  meta: LaravelPaginatorMeta;
}

/**
 * Kardex /inventario/productos/{producto}/kardex
 */
export interface KardexMovimientoDto {
  id: number;
  fecha: string | null;
  tipo_movimiento: string | null;
  cantidad: number | null;
  costo_unitario: number | null;
  saldo_cantidad: number | null;
  almacen: AlmacenDto;
  documento: {
    id: number | null;
    tipo: string | null;
    estado: string | null;
  };
}

export interface KardexProductoHeaderDto {
  id: number;
  sku: string | null;
  nombre: string | null;
}

export interface KardexProductoResponseDto {
  ok: true;
  producto: KardexProductoHeaderDto;
  data: KardexMovimientoDto[];
  meta: LaravelPaginatorMeta;
}

/**
 * Resumen /inventario/productos/{producto}/kardex/resumen
 */
export interface KardexResumenResponseDto {
  ok: true;
  filters: {
    producto_id: number;
    almacen_id: number | null;
    desde: string | null;
    hasta: string | null;
  };
  producto: KardexProductoHeaderDto;
  kpis: {
    movimientos_total: number;
    entradas_cantidad: number;
    salidas_cantidad: number;
    neto_cantidad: number;
    entradas_valor: number;
    salidas_valor: number;
  };
  ultimo_movimiento: KardexMovimientoDto | null;
}