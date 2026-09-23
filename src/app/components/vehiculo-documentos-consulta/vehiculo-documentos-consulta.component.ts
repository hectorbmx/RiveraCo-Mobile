import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

type DocumentoEstado = 'ok' | 'warning' | 'danger' | 'empty' | string;

type SeguroConsulta = {
  estatus?: string | null;
  estado_visual?: DocumentoEstado | null;
  aseguradora?: string | null;
  poliza_numero?: string | null;
  vigencia_desde?: string | null;
  vigencia_hasta?: string | null;
  dias_restantes?: number | null;
  documento_url?: string | null;
  documento_disponible?: boolean;
};

type TarjetaCirculacionConsulta = {
  estatus?: string | null;
  estado_visual?: DocumentoEstado | null;
  fecha_vencimiento?: string | null;
  dias_restantes?: number | null;
  documento_url?: string | null;
  documento_disponible?: boolean;
};

type VehiculoDocumentosConsulta = {
  estado?: DocumentoEstado | null;
  seguro?: SeguroConsulta | null;
  tarjeta_circulacion?: TarjetaCirculacionConsulta | null;
};

@Component({
  selector: 'app-vehiculo-documentos-consulta',
  standalone: true,
  imports: [
    CommonModule,
    IonBadge,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonText,
    IonTitle,
    IonToolbar,
  ],
  template: `
    <div class="documentos-entry">
      <ion-button expand="block" fill="outline" size="small" (click)="abrirModal()">
        Ver poliza y tarjeta
      </ion-button>

      <ion-badge [color]="badgeColor(documentosConsulta?.estado || 'empty')">
        {{ estadoGeneralLabel }}
      </ion-badge>
    </div>

    <ion-modal [isOpen]="modalOpen" cssClass="vehiculo-documentos-modal" (didDismiss)="cerrarModal()">
      <ng-template>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Documentos del vehiculo</ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" (click)="cerrarModal()">Cerrar</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <ion-card class="documento-card">
            <ion-card-header>
              <ion-card-subtitle>SEGURO</ion-card-subtitle>
              <ion-card-title>Poliza de seguro</ion-card-title>
            </ion-card-header>

            <ion-card-content>
              <div class="documento-status">
                <ion-badge [color]="badgeColor(seguro?.estado_visual || 'empty')">
                  {{ seguro ? estadoLabel(seguro.estado_visual) : 'Sin poliza registrada' }}
                </ion-badge>
              </div>

              <ion-list lines="none" class="detalle-lista" *ngIf="seguro; else sinSeguro">
                <ion-item>
                  <ion-label>
                    <p>Aseguradora</p>
                    <h3>{{ seguro.aseguradora || 'Sin dato' }}</h3>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <p>Poliza</p>
                    <h3>{{ seguro.poliza_numero || 'Sin dato' }}</h3>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <p>Vigencia</p>
                    <h3>{{ seguro.vigencia_desde || 'N/A' }} - {{ seguro.vigencia_hasta || 'N/A' }}</h3>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <p>Dias restantes</p>
                    <h3>{{ seguro.dias_restantes ?? 'N/A' }}</h3>
                  </ion-label>
                </ion-item>
              </ion-list>

              <ng-template #sinSeguro>
                <ion-text color="medium">
                  <p class="empty-text">Este vehiculo no tiene poliza vigente para consultar.</p>
                </ion-text>
              </ng-template>

              <ion-button
                expand="block"
                class="documento-action"
                [disabled]="!seguro?.documento_disponible"
                (click)="abrirDocumento(seguro?.documento_url)"
              >
                Abrir poliza
              </ion-button>
            </ion-card-content>
          </ion-card>

          <ion-card class="documento-card">
            <ion-card-header>
              <ion-card-subtitle>TARJETA DE CIRCULACION</ion-card-subtitle>
              <ion-card-title>Documento vehicular</ion-card-title>
            </ion-card-header>

            <ion-card-content>
              <div class="documento-status">
                <ion-badge [color]="badgeColor(tarjeta?.estado_visual || 'empty')">
                  {{ tarjeta ? estadoLabel(tarjeta.estado_visual) : 'Sin tarjeta registrada' }}
                </ion-badge>
              </div>

              <ion-list lines="none" class="detalle-lista" *ngIf="tarjeta; else sinTarjeta">
                <ion-item>
                  <ion-label>
                    <p>Vencimiento</p>
                    <h3>{{ tarjeta.fecha_vencimiento || 'N/A' }}</h3>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-label>
                    <p>Dias restantes</p>
                    <h3>{{ tarjeta.dias_restantes ?? 'N/A' }}</h3>
                  </ion-label>
                </ion-item>
              </ion-list>

              <ng-template #sinTarjeta>
                <ion-text color="medium">
                  <p class="empty-text">Este vehiculo no tiene tarjeta de circulacion vigente para consultar.</p>
                </ion-text>
              </ng-template>

              <ion-button
                expand="block"
                class="documento-action"
                [disabled]="!tarjeta?.documento_disponible"
                (click)="abrirDocumento(tarjeta?.documento_url)"
              >
                Abrir tarjeta
              </ion-button>
            </ion-card-content>
          </ion-card>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .documentos-entry {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }

    .documentos-entry ion-badge {
      justify-self: start;
      padding: 7px 10px;
      border-radius: 999px;
      font-size: 11px;
      letter-spacing: 0;
    }

    .documento-card {
      margin: 0 0 14px;
      border-radius: 8px;
    }

    .documento-status {
      margin-bottom: 12px;
    }

    .detalle-lista {
      background: transparent;
      margin-bottom: 12px;
    }

    .detalle-lista ion-item {
      --background: transparent;
      --padding-start: 0;
      --inner-padding-end: 0;
    }

    .detalle-lista p {
      color: var(--ion-color-medium);
      font-size: 12px;
      margin-bottom: 3px;
    }

    .detalle-lista h3 {
      color: var(--ion-color-dark);
      font-size: 15px;
      font-weight: 700;
      margin: 0;
    }

    .empty-text {
      margin: 2px 0 14px;
      line-height: 1.4;
    }

    .documento-action {
      margin-top: 8px;
    }
  `],
})
export class VehiculoDocumentosConsultaComponent {
  @Input() documentosConsulta: VehiculoDocumentosConsulta | null | undefined;

  modalOpen = false;

  get seguro(): SeguroConsulta | null {
    return this.documentosConsulta?.seguro ?? null;
  }

  get tarjeta(): TarjetaCirculacionConsulta | null {
    return this.documentosConsulta?.tarjeta_circulacion ?? null;
  }

  get estadoGeneralLabel(): string {
    return this.estadoLabel(this.documentosConsulta?.estado || 'empty');
  }

  abrirModal() {
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
  }

  abrirDocumento(url?: string | null) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  badgeColor(estado?: DocumentoEstado | null): string {
    if (estado === 'ok') return 'success';
    if (estado === 'warning') return 'warning';
    if (estado === 'danger') return 'danger';
    return 'medium';
  }

  estadoLabel(estado?: DocumentoEstado | null): string {
    if (estado === 'ok') return 'Vigente';
    if (estado === 'warning') return 'Por vencer';
    if (estado === 'danger') return 'Vencido';
    return 'Sin documentos';
  }
}