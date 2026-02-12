import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gerencial-inventario',
  templateUrl: './gerencial-inventario.page.html',
  styleUrls: ['./gerencial-inventario.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GerencialInventarioPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
