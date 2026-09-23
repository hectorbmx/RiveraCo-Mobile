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
  selectedPilaId: number | null = null;
  selectedPilaLabel = '';

  obra: any = null;
  allRows: any[] = [];
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
    const query = this.route.snapshot.queryParamMap;
    const pilaId = Number(query.get('pila_id'));

    this.selectedPilaId = Number.isFinite(pilaId) && pilaId > 0 ? pilaId : null;
    this.selectedPilaLabel = this.buildSelectedPilaLabel(
      query.get('tipo'),
      query.get('diametro'),
      query.get('profundidad')
    );

    this.load();
  }

  load() {
    this.loading = true;

    this.obrasSrv.getComisionesObra(this.obraId).subscribe({
      next: (resp) => {
        const d = resp?.data;

        this.obra = d?.obra ?? null;
        this.allRows = d?.rows ?? [];
        this.rows = this.filtrarRowsPorPila(this.allRows);
        this.totalRealizadas = this.selectedPilaId
          ? this.sumarPilas(this.rows)
          : (d?.total_realizadas ?? 0);

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando pilas', err);
        this.loading = false;
      }
    });
  }

  filtrarRowsPorPila(rows: any[]): any[] {
    if (!this.selectedPilaId) {
      return rows;
    }

    return rows
      .map((row) => {
        const comisiones = (row.comisiones ?? [])
          .filter((comision: any) => Number(comision?.pila?.id) === this.selectedPilaId);

        return {
          ...row,
          comisiones,
          comisiones_registradas: comisiones.length,
          total_pilas: this.sumarComisiones(comisiones),
        };
      })
      .filter((row) => row.comisiones.length > 0);
  }

  sumarPilas(rows: any[]): number {
    return rows.reduce((total, row) => total + Number(row?.total_pilas ?? 0), 0);
  }

  sumarComisiones(comisiones: any[]): number {
    return comisiones.reduce((total, comision) => total + Number(comision?.total_pilas ?? 0), 0);
  }

  buildSelectedPilaLabel(tipo: string | null, diametro: string | null, profundidad: string | null): string {
    const partes = [tipo, diametro ? `${diametro}m diam.` : null, profundidad ? `${profundidad}m prof.` : null]
      .filter(Boolean);

    return partes.join(' - ');
  }

  goBack() {
    this.navCtrl.back();
  }
}
