import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NavController } from '@ionic/angular';
import { IonContent, IonHeader, IonIcon, IonProgressBar, IonSpinner, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  businessOutline, chevronBack, chevronForward, chevronForwardOutline,
  cameraOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
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
  imports: [IonContent, IonHeader, IonTitle, ProfileMenuComponent, CommonModule,IonProgressBar, FormsModule,IonSpinner,IonIcon,RouterModule]
})
export class ObrasDetallesPage implements OnInit {
  
  loading = true;

  obra: any = null;
  
  maquinaActiva: any = null;
  asistenciaHoy: any = null;
  empleadosPreview: any[] =[];
  pilasPreview: any[] =[];
  pilasPorTipo: any[] = [];
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
    addIcons({businessOutline,statsChartOutline,hammerOutline,alertCircleOutline,peopleOutline,chevronForwardOutline,informationCircleOutline,cubeOutline,chevronBack,chevronForward,personCircle,cameraOutline,checkmarkCircleOutline,closeCircleOutline});
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
        this.asistenciaHoy = d?.asistencia_hoy ?? null;
        this.empleadosPreview = d?.empleados_preview ?? [];
        this.pilasPreview = d?.pilas_preview ?? [];
        this.pilasPorTipo = d?.pilas_por_tipo ?? [];
console.log('empleadosPreview', this.empleadosPreview);
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
estadoAsistenciaClase(): string {
  const resumen = this.asistenciaHoy?.resumen;

  if (!resumen || resumen.esperados === 0) {
    return 'attendance-neutral';
  }

  if (this.asistenciaHoy?.completa) {
    return 'attendance-complete';
  }

  if ((resumen.sin_entrada ?? 0) > 0) {
    return 'attendance-missing';
  }

  return 'attendance-warning';
}

estadoAsistenciaTitulo(): string {
  const resumen = this.asistenciaHoy?.resumen;

  if (!resumen || resumen.esperados === 0) {
    return 'Sin empleados asignados';
  }

  if (this.asistenciaHoy?.completa) {
    return 'Checada completa';
  }

  if ((resumen.sin_entrada ?? 0) > 0) {
    return 'Faltan entradas';
  }

  if ((resumen.entrada_sin_foto ?? 0) > 0) {
    return 'Faltan fotos de ingreso';
  }

  return 'Asistencia en revisión';
}

estadoAsistenciaDetalle(): string {
  const resumen = this.asistenciaHoy?.resumen;

  if (!resumen || resumen.esperados === 0) {
    return 'No hay personal activo para evaluar hoy.';
  }

  if (this.asistenciaHoy?.completa) {
    return 'Todos los empleados esperados tienen entrada con foto.';
  }

  if ((resumen.sin_entrada ?? 0) > 0) {
    return `${resumen.sin_entrada} empleado(s) sin entrada registrada.`;
  }

  return `${resumen.entrada_sin_foto ?? 0} empleado(s) tienen entrada, pero falta foto.`;
}

iconoAsistencia(): string {
  const clase = this.estadoAsistenciaClase();

  if (clase === 'attendance-complete') {
    return 'checkmark-circle-outline';
  }

  if (clase === 'attendance-warning') {
    return 'camera-outline';
  }

  if (clase === 'attendance-missing') {
    return 'close-circle-outline';
  }

  return 'information-circle-outline';
}

faltantesAsistencia(): any[] {
  return (this.asistenciaHoy?.faltantes ?? []).slice(0, 5);
}
goBack() {
  this.navCtrl.back();
}
goToMaquinaDetalle() {
  const maquinaId =
    this.maquinaActiva?.maquina_id ??
    this.maquinaActiva?.maquina?.id;

  if (!maquinaId) return;

  this.router.navigate(['/tabs-gerencial/maquina-detalle', maquinaId], {
    queryParams: { returnObraId: this.obra?.id }
  });
}
pilaPorcentaje(pila: any): number {
  const programadas = Number(pila?.cantidad_programada ?? 0);
  const ejecutadas = Number(pila?.cantidad_ejecutada ?? 0);

  if (programadas <= 0) {
    return 0;
  }

  return Math.min((ejecutadas / programadas) * 100, 100);
}

faltantesPila(pila: any): number {
  const programadas = Number(pila?.cantidad_programada ?? 0);
  const ejecutadas = Number(pila?.cantidad_ejecutada ?? 0);

  return Math.max(programadas - ejecutadas, 0);
}

goToPilasDetalles(pila?: any) {
  if (!this.obra?.id) return;

  const queryParams = pila?.id ? {
    pila_id: pila.id,
    tipo: pila.tipo,
    diametro: pila.diametro,
    profundidad: pila.profundidad,
  } : undefined;

  this.router.navigate([
    '/tabs-gerencial/obras-detalles',
    this.obra.id,
    'pilas-detalles'
  ], { queryParams });
}

}



