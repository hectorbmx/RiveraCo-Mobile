import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gerencial-maquinas',
  templateUrl: './gerencial-maquinas.page.html',
  styleUrls: ['./gerencial-maquinas.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GerencialMaquinasPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
