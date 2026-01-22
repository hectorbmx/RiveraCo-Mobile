import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { AuthService, LoginCredentials } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
   
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,IonCheckbox,
    IonText
  ]
})
export class LoginPage {
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async onLogin() {
    // Validación básica
    if (!this.credentials.email || !this.credentials.password) {
      await this.showToast('Por favor completa todos los campos', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión...',
    });
    await loading.present();

    this.authService.login(this.credentials).subscribe({
      next: async (response) => {
        await loading.dismiss();
          // Guardar user_id para usarlo después
        // localStorage.setItem('user_id', String(response.user.id));

        // (opcional) guardar el usuario completo
        // localStorage.setItem('user', JSON.stringify(response.user));
        await this.showToast('Bienvenido ' + response.user.name, 'success');


        console.log('Login response completo:', response);
        console.log('Empleados:', response.contexto?.empleados);

        console.log('Contexto obra:', response.contexto?.obra);
        console.log('Maquina activa:', response.contexto?.maquina);
        // this.router.navigate(['/tabs/tab1']);
        this.router.navigate(['/tabs', 'tab1']);
      },
      error: async (error) => {
        await loading.dismiss();
        await this.showToast(error.message || 'Error al iniciar sesión', 'danger');
      }
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}