import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
import { fingerPrintOutline, eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';
import { BiometricLoginService } from '../../services/biometric-login.service';
import { AuthService, LoginCredentials } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
   
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,IonCheckbox,
    IonIcon
  ]
})
export class LoginPage implements OnInit {
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };
  rememberMe = true; // o false por default, como prefieras
  enableBiometricLogin = false;
  biometricAvailable = false;
  biometricConfigured = false;
  biometricLabel = 'Face ID';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private biometricLogin: BiometricLoginService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {
    addIcons({ eyeOutline, eyeOffOutline, fingerPrintOutline });
  }

  async ngOnInit() {
    await this.loadBiometricState();
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
        if (this.enableBiometricLogin && response.token) {
          await this.biometricLogin.saveToken(response.token);
          await this.loadBiometricState();
        }

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

  async onBiometricLogin() {
    const loading = await this.loadingCtrl.create({
      message: `Validando ${this.biometricLabel}...`,
    });
    await loading.present();

    try {
      const token = await this.biometricLogin.authenticateAndGetToken();

      if (!token) {
        await loading.dismiss();
        return;
      }

      await firstValueFrom(this.authService.restoreSessionWithToken(token));
      await loading.dismiss();
      await this.showToast('Bienvenido de nuevo', 'success');
      await this.router.navigate(['/home']);
    } catch (error: any) {
      await loading.dismiss();
      await this.biometricLogin.clearSavedLogin();
      await this.loadBiometricState();
      await this.showToast(error?.message || 'No se pudo iniciar con biometria', 'danger');
    }
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

  private async loadBiometricState() {
    const state = await this.biometricLogin.getState();
    this.biometricAvailable = state.available;
    this.biometricConfigured = state.configured;
    this.biometricLabel = state.label;
  }
}
