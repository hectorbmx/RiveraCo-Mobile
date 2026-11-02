import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MecanicoLoadingService } from './mecanico-loading.service';

interface CargaNavegacion {
  id: number | null;
  navegada: boolean;
  vistas: Set<EventTarget>;
  consultas: Set<symbol>;
  finalizar: () => void;
  frame: number | null;
}

/** Coordinates Angular navigation, Ionic transitions and their initial API reads. */
@Injectable({ providedIn: 'root' })
export class NavegacionLoadingService {
  private document = inject(DOCUMENT);
  private destroy = inject(DestroyRef);
  private actual: CargaNavegacion | null = null;

  constructor(router: Router, private loading: MecanicoLoadingService) {
    router.events.pipe(takeUntilDestroyed(this.destroy)).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.cerrar();
        this.crear(event.id, false);
      } else if (event instanceof NavigationEnd) {
        if (this.actual?.id === event.id) { this.actual.navegada = true; this.comprobar(this.actual); }
      } else if (event instanceof NavigationCancel || event instanceof NavigationError || event instanceof NavigationSkipped) {
        if (this.actual?.id === event.id) this.cerrar();
      }
    });
    // Ionic lifecycle events do not bubble. Capture observes nested tab outlets too.
    this.document.addEventListener('ionViewWillEnter', this.entrar, true);
    this.document.addEventListener('ionViewDidEnter', this.lista, true);
    this.document.addEventListener('ionViewDidLeave', this.abandonada, true);
    this.destroy.onDestroy(() => {
      this.document.removeEventListener('ionViewWillEnter', this.entrar, true);
      this.document.removeEventListener('ionViewDidEnter', this.lista, true);
      this.document.removeEventListener('ionViewDidLeave', this.abandonada, true);
      this.cerrar();
    });
  }

  registrarConsulta(): (() => void) | null {
    const carga = this.actual;
    if (!carga) return null;
    const id = Symbol('consulta-inicial');
    carga.consultas.add(id);
    this.cancelarFrame(carga);
    return () => { carga.consultas.delete(id); this.comprobar(carga); };
  }

  private entrar = (event: Event) => {
    const target = this.vista(event);
    if (!target) return;
    const carga = this.actual ?? this.crear(null, true);
    this.cancelarFrame(carga);
    carga.vistas.add(target);
  };

  private lista = (event: Event) => {
    const target = this.vista(event);
    if (!target || !this.actual) return;
    this.actual.vistas.delete(target);
    this.comprobar(this.actual);
  };

  private abandonada = (event: Event) => {
    const target = this.vista(event);
    if (!target || !this.actual?.vistas.has(target)) return;
    this.actual.vistas.delete(target);
    this.comprobar(this.actual);
  };

  private vista(event: Event): Element | null {
    const target = event.target;
    // Modal image viewers and other overlays are not route changes.
    return target instanceof Element && !target.closest('ion-modal, ion-popover') && target.closest('ion-router-outlet')
      ? target : null;
  }

  private crear(id: number | null, navegada: boolean): CargaNavegacion {
    const carga: CargaNavegacion = { id, navegada, vistas: new Set(), consultas: new Set(), frame: null,
      finalizar: this.loading.iniciar('Cargando pantalla…') };
    this.actual = carga;
    return carga;
  }

  private comprobar(carga: CargaNavegacion) {
    if (this.actual !== carga || !carga.navegada || carga.vistas.size || carga.consultas.size || carga.frame !== null) return;
    const win = this.document.defaultView;
    if (!win) { this.cerrar(); return; }
    // Allow the destination to mount/start its requests before releasing the overlay.
    // This also completes query-only navigations that have no Ionic view transition.
    carga.frame = win.requestAnimationFrame(() => {
      carga.frame = win.requestAnimationFrame(() => {
        carga.frame = null;
        if (this.actual === carga && carga.navegada && !carga.vistas.size && !carga.consultas.size) this.cerrar();
      });
    });
  }

  private cancelarFrame(carga: CargaNavegacion) {
    if (carga.frame !== null) this.document.defaultView?.cancelAnimationFrame(carga.frame);
    carga.frame = null;
  }

  private cerrar() {
    const carga = this.actual;
    this.actual = null;
    if (carga) { this.cancelarFrame(carga); carga.finalizar(); }
  }
}
