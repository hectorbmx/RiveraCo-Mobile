import { MecanicoLoadingService } from '../services/mecanico-loading.service';
import type { RefresherCustomEvent } from '@ionic/core';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonRefresher, IonRefresherContent, IonSearchbar, IonToggle, IonList, IonItem, IonLabel, IonSpinner } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';
import { MetaMecanico } from '../services/mecanico-consulta.service';
import { mensajeOperacion, MecanicoOperacionService, ProductoMecanico } from '../services/mecanico-operacion.service';

@Component({ standalone: true, selector: 'app-mecanico-productos', styleUrls: ['./mecanico-consulta.page.scss'],
  imports: [CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonRefresher, IonRefresherContent, IonSearchbar, IonToggle, IonList, IonItem, IonLabel, IonSpinner],
  template: `<ion-header><ion-toolbar><ion-buttons slot="start"><ion-button [routerLink]="regreso">Volver</ion-button></ion-buttons><ion-title>Productos de Giralda</ion-title></ion-toolbar></ion-header>
  <ion-content><ion-refresher slot="fixed" (ionRefresh)="refrescar($event)"><ion-refresher-content pullingText="Desliza para actualizar" refreshingText="Actualizando…" refreshingSpinner="crescent"></ion-refresher-content></ion-refresher><main><ion-searchbar aria-label="Buscar productos" placeholder="Nombre o SKU" [(ngModel)]="q" [debounce]="350" (ionInput)="cargar()"/><ion-toggle [(ngModel)]="conExistencia" (ionChange)="cargar()">Solo disponibles</ion-toggle>
  <p class="muted">Consulta informativa. La solicitud de materiales no reserva ni descuenta estas existencias.</p><div class="estado" *ngIf="cargando"><ion-spinner/></div><div *ngIf="error" role="alert"><p>{{ error }}</p><ion-button (click)="cargar()">Reintentar</ion-button></div>
  <ion-list *ngIf="!cargando && !error"><ion-item *ngFor="let producto of productos"><ion-label class="ion-text-wrap"><h2>{{ producto.nombre }}</h2><p>{{ producto.sku }} · {{ producto.unidad_stock || producto.unidad }}</p><p>Actual: {{ producto.stock.stock_actual }} · Reservado: {{ producto.stock.stock_reservado }} · Disponible: {{ producto.stock.disponible }}</p><p *ngIf="!producto.tiene_registro_stock">Sin registro de stock en Giralda.</p></ion-label></ion-item></ion-list>
  <p *ngIf="!cargando && !error && !productos.length">No se encontraron productos.</p><div class="paginacion" *ngIf="meta && meta.last_page > 1"><ion-button [disabled]="cargando || meta.current_page <= 1" (click)="cargar(meta.current_page - 1)">Anterior</ion-button><span>{{ meta.current_page }} / {{ meta.last_page }}</span><ion-button [disabled]="cargando || meta.current_page >= meta.last_page" (click)="cargar(meta.current_page + 1)">Siguiente</ion-button></div></main></ion-content>` })
export class MecanicoProductosPage implements OnInit, OnDestroy {
  productos: ProductoMecanico[] = []; meta: MetaMecanico | null = null; q = ''; conExistencia = false; cargando = false; error = ''; private secuencia = 0;
  regreso: (string | number)[] = ['/tabs-mecanico/servicios'];
  constructor(private route: ActivatedRoute, private operaciones: MecanicoOperacionService, private auth: AuthService, private loaderCorporativo: MecanicoLoadingService) {}
  ngOnInit() { const id = Number(this.route.snapshot.queryParamMap.get('servicio')); if (Number.isInteger(id) && id > 0) this.regreso.push(id); void this.cargar(); }
  ngOnDestroy() { this.cerrarCarga?.(); this.secuencia++; }
  private cerrarCarga: (() => void) | null = null;
  ionViewWillLeave() { this.cerrarCarga?.(); this.cerrarCarga = null; }
  async refrescar(event: RefresherCustomEvent) {
    let finalizar: (() => void) | null = null;
    try {
      if (this.cargando) return;
      finalizar = this.loaderCorporativo.iniciar('Actualizando existencias…');
      this.cerrarCarga = finalizar;
      await this.cargar(this.meta?.current_page || 1);
    } finally {
      finalizar?.();
      if (this.cerrarCarga === finalizar) this.cerrarCarga = null;
      await event.target.complete();
    }
  }
  async cargar(page = 1) {
    const turno = ++this.secuencia; this.cargando = true; this.error = ''; this.productos = []; this.meta = null;
    try { const response = await firstValueFrom(this.operaciones.productos(page, this.q, this.conExistencia)); if (turno === this.secuencia) { this.productos = response.data; this.meta = response.meta; } }
    catch (error: any) { if (turno === this.secuencia) this.error = mensajeOperacion(error); if (error?.status === 401) this.auth.logout(); }
    finally { if (turno === this.secuencia) this.cargando = false; }
  }
}
