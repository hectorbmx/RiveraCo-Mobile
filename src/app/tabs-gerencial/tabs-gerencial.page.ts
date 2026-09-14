import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { briefcaseOutline, calculatorOutline, cogOutline, gridOutline, homeOutline, logOutOutline, peopleOutline, repeatOutline, speedometerOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-tabs-gerencial',
  templateUrl: './tabs-gerencial.page.html',
  styleUrls: ['./tabs-gerencial.page.scss'],
  standalone: true,
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsGerencialPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {
    addIcons({ homeOutline, gridOutline, cogOutline, peopleOutline, calculatorOutline, logOutOutline, briefcaseOutline, speedometerOutline, repeatOutline });
  }

  get puedeCambiarContexto(): boolean {
    return this.authService.panelesDisponiblesValue.length > 1 || this.authService.obrasResidenteValue.length > 1;
  }

  irSelector() {
    this.router.navigate(['/selector-panel']);
  }

  async presentLogoutConfirm() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres salir del sistema?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salir', handler: () => this.authService.logout() },
      ],
    });

    await alert.present();
  }
}

