import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, finalize } from 'rxjs';
import { MecanicoLoadingService } from '../services/mecanico-loading.service';

function mensajeMovimiento(url: string, metodo: string): string {
  const ruta = url.split('?')[0];
  if (ruta.endsWith('/asignar-obra')) return 'Asignando máquina a obra…';
  if (ruta.endsWith('/baja-obra')) return 'Pasando máquina al patio…';
  if (ruta.endsWith('/ubicacion')) return 'Actualizando ubicación…';
  if (ruta.endsWith('/horas')) return 'Guardando lectura de la máquina…';
  if (ruta.endsWith('/generar-orden')) return 'Generando orden de servicio…';
  if (ruta.endsWith('/materiales')) return 'Guardando ajustes de materiales…';
  if (ruta.endsWith('/abastecimientos')) return 'Registrando solicitud de materiales…';
  if (ruta.endsWith('/evidencias')) return 'Guardando evidencias…';
  if (ruta.endsWith('/iniciar')) return 'Iniciando servicio…';
  if (ruta.endsWith('/completar')) return 'Completando servicio…';
  if (/\/servicios(?:\/\d+)?$/.test(ruta)) return metodo === 'POST' ? 'Guardando nuevo servicio…' : 'Guardando cambios del servicio…';
  return 'Procesando movimiento…';
}

export const mecanicoLoadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
    || !/\/api\/v1\/mecanico(?:\/|$)/.test(request.url.split('?')[0])) return next(request);
  const loading = inject(MecanicoLoadingService);
  return defer(() => {
    const finalizar = loading.iniciar(mensajeMovimiento(request.url, request.method));
    try { return next(request).pipe(finalize(finalizar)); }
    catch (error) { finalizar(); throw error; }
  });
};
