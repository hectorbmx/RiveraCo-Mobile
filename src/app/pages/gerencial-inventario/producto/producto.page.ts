import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';

import {
  IonBadge,
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, personCircle, pricetag, timeOutline } from 'ionicons/icons';
import { KardexResumenResponseDto } from 'src/app/models/inventario.model';
import { GerencialInventarioService } from 'src/app/services/gerencial-inventario.service';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.scss'],
  standalone:true,
  imports:[
    IonIcon,IonContent,IonSpinner,CommonModule,FormsModule,IonBadge
  ]
})
export class ProductoPage implements OnInit {
  loading = true;
  productoId!: number;
  almacenId: number | null = null;

  resumen: KardexResumenResponseDto | null = null;

  constructor(
    private route: ActivatedRoute,
    private inv: GerencialInventarioService,
    private nav: NavController
  ) {
    addIcons ({ pricetag,timeOutline,personCircle,chevronBack })
  }

  ngOnInit() {
    this.productoId = Number(this.route.snapshot.paramMap.get('id'));
    const a = this.route.snapshot.queryParamMap.get('almacen_id');
    this.almacenId = a ? Number(a) : null;

    this.cargarResumen();
  }
goBack() {
  this.nav.back();
}
  cargarResumen() {
    this.loading = true;

    this.inv.resumenProducto(this.productoId, {
      almacen_id: this.almacenId ?? undefined,
      days: 30, // default 30 días si no hay fechas
    }).subscribe({
      next: (res) => {
        this.resumen = res;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }
  getMoveBadgeClass(tipo: string | null | undefined): string {
  const t = (tipo || '').toLowerCase();
  if (t === 'entrada') return 'badge-ok';
  if (t === 'salida') return 'badge-zero';
  return 'badge-patio';
}
}