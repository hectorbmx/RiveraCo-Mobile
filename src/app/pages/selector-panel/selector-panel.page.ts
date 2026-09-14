import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { businessOutline, chevronForwardOutline, constructOutline, refreshOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { AuthService, ObraResidenteOption, PanelDisponible } from '../../services/auth';

@Component({
  selector: 'app-selector-panel',
  templateUrl: './selector-panel.page.html',
  styleUrls: ['./selector-panel.page.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar],
})
export class SelectorPanelPage implements OnInit {
  paneles: PanelDisponible[] = [];
  obras: ObraResidenteOption[] = [];
  selectedPanel: string | null = null;
  loading = false;

  constructor(
    public auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    addIcons({ businessOutline, chevronForwardOutline, constructOutline, refreshOutline });
  }

  async ngOnInit() {
    this.syncFromAuth();

    if (this.paneles.length === 0) {
      await this.refreshOptions();
    }
  }

  async refreshOptions() {
    this.loading = true;

    try {
      await firstValueFrom(this.auth.getMe());
      this.syncFromAuth();
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudieron cargar tus opciones', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async choosePanel(panel: string) {
    this.auth.setSelectedPanel(panel);
    this.selectedPanel = panel;

    if (panel === 'gerencial') {
      await this.router.navigate(['/tabs-gerencial']);
      return;
    }

    if (this.obras.length === 0) {
      await this.showToast('No tienes obras disponibles para el panel residente', 'warning');
      return;
    }

    if (this.obras.length === 1) {
      await this.chooseObra(this.obras[0]);
    }
  }

  async chooseObra(obra: ObraResidenteOption) {
    this.loading = true;
    this.auth.setSelectedPanel('residente');
    this.auth.setSelectedObraId(obra.id);

    try {
      await firstValueFrom(this.auth.getMe());
      await this.router.navigate(['/tabs', 'tab1']);
    } catch (error: any) {
      await this.showToast(error?.message || 'No se pudo cargar la obra seleccionada', 'danger');
    } finally {
      this.loading = false;
    }
  }

  trackByPanel(_: number, panel: PanelDisponible) {
    return panel.key;
  }

  trackByObra(_: number, obra: ObraResidenteOption) {
    return obra.id;
  }

  private syncFromAuth() {
    this.paneles = this.auth.panelesDisponiblesValue;
    this.obras = this.auth.obrasResidenteValue;
    this.selectedPanel = this.auth.selectedPanelValue;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      color,
      position: 'top',
    });

    await toast.present();
  }
}

