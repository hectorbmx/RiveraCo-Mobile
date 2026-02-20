import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { IonContent, IonHeader, IonIcon, IonProgressBar, IonSpinner, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  businessOutline, chevronBack, chevronForward, chevronForwardOutline,
  cubeOutline,
  hammerOutline,
  informationCircleOutline,
  peopleOutline,
  personCircle, statsChartOutline
} from 'ionicons/icons';
import { ProfileMenuComponent } from 'src/app/components/profile-menu/profile-menu.component';
import { GerencialObrasService } from 'src/app/services/gerencial-obras.service';
@Component({
  selector: 'app-obras-detalles',
  templateUrl: './obras-detalles.page.html',
  styleUrls: ['./obras-detalles.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, ProfileMenuComponent, CommonModule,IonProgressBar, FormsModule,IonSpinner,IonIcon]
})
export class ObrasDetallesPage implements OnInit {
  
  loading = true;

  obra: any = null;
  
  maquinaActiva: any = null;
  empleadosPreview: any[] =[];
  pilasPreview: any[] =[];
kpis = {
  empleados_activos: 0,
  cobranza: { monto_contratado: 0, monto_cobrado: 0, porcentaje: 0 },
  pilas: { programadas: 0, realizadas: 0, faltan: 0, porcentaje: 0, rows: 0 },
};

  constructor(
    private route: ActivatedRoute,
    private obrasSrv: GerencialObrasService,
    private router: Router,
    private navCtrl: NavController
  ) { 
    addIcons({businessOutline,statsChartOutline,hammerOutline,alertCircleOutline,peopleOutline,chevronForwardOutline,informationCircleOutline,cubeOutline,chevronBack,chevronForward,personCircle});
  }

  ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }
   load(id: number) {
    this.loading = true;

    this.obrasSrv.show(id).subscribe({
      next: (resp) => {
        const d = resp?.data;

        this.obra = d?.obra ?? null;
        this.kpis = d?.kpis ?? null;
        this.maquinaActiva = d?.maquina_activa ?? null;
        this.empleadosPreview = d?.empleados_preview ?? [];
        this.pilasPreview = d?.pilas_preview ?? [];

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando obra', err);
        this.loading = false;
      }
    });
  }
//  goToMaquinaDetalle() {
//   const obraId = this.obra?.id;
//   const maquinaId = this.maquinaActiva?.maquina?.id ?? this.maquinaActiva?.maquina_id;

//   if (!obraId || !maquinaId) return;

//   this.router.navigate(['/tabs-gerencial/obras-detalles', obraId, 'maquina-detalle', maquinaId]);
// }
goBack() {
  this.navCtrl.back();
}
goToMaquinaDetalle() {
  const maquinaId =
    this.maquinaActiva?.maquina_id ??
    this.maquinaActiva?.maquina?.id;

  if (!maquinaId) return;

  this.router.navigate(['/tabs-gerencial/maquina-detalle', maquinaId]);
}


}
