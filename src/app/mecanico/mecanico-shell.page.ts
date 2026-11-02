import { AuthService } from '../services/auth';
import { Component } from '@angular/core';
import { AlertController, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { constructOutline, carOutline, clipboardOutline, logOutOutline } from 'ionicons/icons';

@Component({
  standalone: true,
  selector: 'app-mecanico-shell',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `<ion-tabs><ion-tab-bar slot="bottom">
    <ion-tab-button tab="maquinas" href="/tabs-mecanico/maquinas"><ion-icon name="construct-outline"/><ion-label>Máquinas</ion-label></ion-tab-button>
    <ion-tab-button tab="vehiculos" href="/tabs-mecanico/vehiculos"><ion-icon name="car-outline"/><ion-label>Vehículos</ion-label></ion-tab-button>
    <ion-tab-button tab="servicios" href="/tabs-mecanico/servicios"><ion-icon name="clipboard-outline"/><ion-label>Servicios</ion-label></ion-tab-button>
    <ion-tab-button (click)="salir()" aria-label="Cerrar sesión"><ion-icon name="log-out-outline"/><ion-label>Salir</ion-label></ion-tab-button>
  </ion-tab-bar></ion-tabs>`,
})
export class MecanicoShellPage {
  private confirmando = false;
  constructor(private auth: AuthService, private alert: AlertController) { addIcons({ constructOutline, carOutline, clipboardOutline, logOutOutline }); }

  async salir() {
    if (this.confirmando) return;
    this.confirmando = true;
    try {
      const alerta = await this.alert.create({ header: 'Cerrar sesión', message: '¿Quieres salir del sistema?',
        buttons: [{ text: 'Cancelar', role: 'cancel' }, { text: 'Salir', handler: () => this.auth.logout() }] });
      await alerta.present(); await alerta.onDidDismiss();
    } finally { this.confirmando = false; }
  }
}
