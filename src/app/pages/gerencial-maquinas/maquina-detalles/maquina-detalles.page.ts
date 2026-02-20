import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-maquina-detalles',
  templateUrl: './maquina-detalles.page.html',
  styleUrls: ['./maquina-detalles.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class MaquinaDetallesPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
