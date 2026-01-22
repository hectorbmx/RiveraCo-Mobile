import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonBackButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-empleado-detalles',
  templateUrl: './empleado-detalles.page.html',
  styleUrls: ['./empleado-detalles.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonBackButton]
})
export class EmpleadoDetallesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
