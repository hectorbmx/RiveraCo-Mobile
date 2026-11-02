import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, finalize } from 'rxjs';
import { environment } from '../../environments/environment';
import { NavegacionLoadingService } from '../services/navegacion-loading.service';

export const navegacionLoadingInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.method !== 'GET' || request.responseType !== 'json'
    || !request.url.startsWith(environment.apiUrl.replace(/\/$/, '') + '/')) return next(request);
  const navegacion = inject(NavegacionLoadingService);
  return defer(() => {
    const finalizar = navegacion.registrarConsulta();
    if (!finalizar) return next(request);
    try { return next(request).pipe(finalize(finalizar)); }
    catch (error) { finalizar(); throw error; }
  });
};
