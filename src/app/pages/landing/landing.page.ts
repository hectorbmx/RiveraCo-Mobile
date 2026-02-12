import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-landing',
  template: `
    <ion-content class="ion-padding">
      <!-- puede quedar vacío; si quieres UX, deja un loader simple -->
      Cargando...
    </ion-content>
  `,
  imports: [IonContent],
})
export class LandingPage {}
