import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router'; // <--- 1. Importa esto
import {
  IonBadge,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSpinner, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircle, alertCircleOutline, bus, chevronForward, construct, person, personCircle, settings } from 'ionicons/icons';
import { ProfileMenuComponent } from 'src/app/components/profile-menu/profile-menu.component';
import { MaquinaListItemDto, MaquinasResponse } from 'src/app/models/maquina.model';
// import { MaquinasGerencialService } from 'src/app/services/gerencial-maquinas.service';
import { MaquinasGerencialService, } from 'src/app/services/gerencial-maquina.service';

@Component({
  selector: 'app-gerencial-maquinas',
  templateUrl: './gerencial-maquinas.page.html',
  styleUrls: ['./gerencial-maquinas.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, ProfileMenuComponent, RouterModule,
    IonSearchbar, IonList, IonItem, IonLabel, 
    IonBadge, IonIcon, IonSpinner, IonText
  ]
})
export class GerencialMaquinasPage implements OnInit {
  maquinas: MaquinaListItemDto[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  enUso = false;

  constructor(
    private maquinasSvc: MaquinasGerencialService,
    private route: ActivatedRoute
  ) {
    // Registramos los iconos que usaremos
    addIcons({personCircle,chevronForward,alertCircleOutline,construct,bus,alertCircle,settings,person});
  }

  ngOnInit() {
    this.searchTerm = '';
    this.syncFiltersFromRoute();
    this.cargarMaquinas();
  }

  ionViewWillEnter() {
    const prevEnUso = this.enUso;
    this.syncFiltersFromRoute();

    if (prevEnUso !== this.enUso) {
      this.cargarMaquinas();
    }
  }

  private syncFiltersFromRoute() {
    this.enUso = this.route.snapshot.queryParamMap.get('en_uso') === '1';
  }

cargarMaquinas(event?: any) {
  this.loading = true;

  const page = this.searchTerm ? 1 : undefined;
  const q = this.searchTerm?.trim() || undefined;

  this.maquinasSvc.getMaquinas(page, q, this.enUso).subscribe({
   next: (res) => {
  const response = res as MaquinasResponse;
  this.maquinas = response.data.data;
  this.loading = false;
  if (event) event.target.complete();
},
    error: (err) => {
      this.loading = false;
      if (event) event.target.complete();
      console.error('Error al cargar máquinas', err);
    }
  });
}

  onSearchChange(value: string | null | undefined) {
    this.searchTerm = value || '';
    this.cargarMaquinas();
  }

  getIconForTipo(tipo: string | null): string {
    if (!tipo) return 'settings';
    const t = tipo.toLowerCase();
    if (t.includes('bore') || t.includes('perforadora')) return 'construct';
    if (t.includes('camion') || t.includes('transporte')) return 'bus';
    return 'settings';
  }
}
