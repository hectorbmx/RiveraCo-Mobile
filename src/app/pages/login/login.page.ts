import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  LoadingController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
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
    IonIcon
  ]
})
export class LoginPage {
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };
rememberMe = true; // o false por default, como prefieras
showPassword = false;



  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons ({ eyeOutline,eyeOffOutline})
  }

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

    this.authService.login(this.credentials, this.rememberMe).subscribe({
      next: async (response) => {
        await loading.dismiss();
       // localStorage.setItem('user', JSON.stringify(response.user));
        await this.showToast('Bienvenido ' + response.user.name, 'success');


        console.log('Login response completo:', response);
        console.log('Empleados:', response.contexto?.empleados);

        console.log('Contexto obra:', response.contexto?.obra);
        console.log('Maquina activa:', response.contexto?.maquina);
        // this.router.navigate(['/tabs/tab1']);
        // this.router.navigate(['/tabs', 'tab1']);
        this.router.navigate(['/home']);

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
  togglePassword() {
  this.showPassword = !this.showPassword;
}
}