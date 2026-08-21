import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, OnDestroy, OnInit, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  cash,
  construct,
  documentTextOutline,
  ellipse,
  exitOutline,
  logOutOutline,
  people,
  receiptOutline,
  square,
  triangle,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService, Contexto } from '../services/auth';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage implements OnInit, OnDestroy {
  public environmentInjector = inject(EnvironmentInjector);
  contexto: Contexto | null = null;
  private contextoSub?: Subscription;

  constructor(
    private authService: AuthService,
    private alertController: AlertController
  ) {
    addIcons({
      triangle,
      ellipse,
      square,
      people,
      construct,
      cash,
      exitOutline,
      logOutOutline,
      receiptOutline,
      barChartOutline,
      documentTextOutline,
    });
  }

  ngOnInit(): void {
    this.contexto = this.authService.contextoValue;
    this.contextoSub = this.authService.contexto$.subscribe((contexto) => {
      this.contexto = contexto;
    });
  }

  ngOnDestroy(): void {
    this.contextoSub?.unsubscribe();
  }

  get esObraCivil(): boolean {
    return (this.contexto?.obra?.tipo_obra ?? '').toUpperCase() === 'OBRA_CIVIL';
  }

  async presentLogoutConfirm() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres salir del sistema?',
      cssClass: 'custom-alert',
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
