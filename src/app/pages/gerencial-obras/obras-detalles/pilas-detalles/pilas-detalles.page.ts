import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner, IonTitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  chevronBack,
  constructOutline,
  cubeOutline,
  hammerOutline
} from 'ionicons/icons';
import { GerencialObrasService } from 'src/app/services/gerencial-obras.service';

@Component({
  selector: 'app-pilas-detalles',
  templateUrl: './pilas-detalles.page.html',
  styleUrls: ['./pilas-detalles.page.scss'],
  standalone: true,
  imports: [IonTitle, IonHeader, CommonModule, IonContent, IonIcon, IonSpinner]
})
export class PilasDetallesPage implements OnInit {

  loading = true;
  obraId!: number;

  obra: any = null;
  rows: any[] = [];
  totalRealizadas = 0;

  constructor(
    private route: ActivatedRoute,
    private obrasSrv: GerencialObrasService,
    private navCtrl: NavController
  ) {
    addIcons({
      chevronBack,
      cubeOutline,
      calendarOutline,
      constructOutline,
      hammerOutline
    });
  }

  ngOnInit() {
    this.obraId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load() {
    this.loading = true;

    this.obrasSrv.getComisionesObra(this.obraId).subscribe({
      next: (resp) => {
        const d = resp?.data;

        this.obra = d?.obra ?? null;
        this.rows = d?.rows ?? [];
        this.totalRealizadas = d?.total_realizadas ?? 0;

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando pilas', err);
        this.loading = false;
      }
    });
  }

  goBack() {
    this.navCtrl.back();
  }
}