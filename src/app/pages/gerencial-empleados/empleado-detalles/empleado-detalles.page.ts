import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonBackButton, IonBadge, IonButton, IonButtons, IonCard, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { businessOutline, call, constructOutline, mailOutline, personCircle, phonePortraitOutline } from 'ionicons/icons';
import { ProfileMenuComponent } from 'src/app/components/profile-menu/profile-menu.component';
import { GerencialPersonalService } from 'src/app/services/gerencial-personal.service';
@Component({
  selector: 'app-empleado-detalles',
  templateUrl: './empleado-detalles.page.html',
  styleUrls: ['./empleado-detalles.page.scss'],
  standalone: true,
imports: [
    IonContent, IonHeader, IonTitle, IonItem, CommonModule, FormsModule,
    IonButton, IonBackButton, IonButtons, IonLabel, IonList, IonIcon, 
    IonBadge, IonCard, ProfileMenuComponent
  ]})
export class EmpleadoDetallesPage implements OnInit {
id: string | null = null;
empleado: any = null; // Aquí guardaremos la respuesta de la API
  loading: boolean = true;
  constructor(
    private route: ActivatedRoute,
    private personalSvc: GerencialPersonalService
  ) { 
    addIcons ({call,businessOutline,constructOutline,phonePortraitOutline,personCircle,mailOutline})
  }

ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.obtenerDetalle();
    }
  }
  obtenerDetalle() {
    this.loading = true;
    this.personalSvc.getEmpleado(this.id!).subscribe({
      next: (res) => {
        this.empleado = res.data;
        this.loading = false;
        console.log('Datos del empleado:', this.empleado);
      },
      error: (err) => {
        console.error('Error al cargar el detalle:', err);
        this.loading = false;
      }
    });
  }

}
