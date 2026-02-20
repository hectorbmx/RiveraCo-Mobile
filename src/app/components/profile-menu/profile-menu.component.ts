import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonButton, IonContent, IonIcon, IonPopover } from '@ionic/angular/standalone';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [CommonModule, IonIcon, IonPopover, IonContent, IonButton],
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.scss'],
})
export class ProfileMenuComponent {
  // ✅ Por si quieres pasar el nombre desde afuera (opcional)
  @Input() userName: string | null = null;

  isOpen = false;
  popoverEvent: any;

  open(ev: any) {
    this.popoverEvent = ev;
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
  }

  logout() {
    // 🔥 aquí conectaremos tu AuthService real cuando me digas dónde lo tienes
    // this.auth.logout();
    this.isOpen = false;
    console.log('logout');
  }
}