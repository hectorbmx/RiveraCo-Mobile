import { Component, EnvironmentInjector, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cash, construct, ellipse, exitOutline, logOutOutline, people, receiptOutline, square, triangle } from 'ionicons/icons';
import { AuthService } from '../services/auth';


@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor(
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({ triangle, ellipse, square,people,construct,cash,exitOutline,logOutOutline,receiptOutline });
  }
   async presentLogoutConfirm() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres salir del sistema?',
      cssClass: 'custom-alert', // Para darle estilo de construcción
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Salir',
          handler: () => {
            this.authService.logout();
          }
        }
      ]
    });

    await alert.present();
  }
}
