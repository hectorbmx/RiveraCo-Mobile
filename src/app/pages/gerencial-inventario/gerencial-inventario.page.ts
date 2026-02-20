import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import {
  IonBadge,
  IonContent, IonHeader,
  IonIcon,
  IonInfiniteScroll, IonInfiniteScrollContent,
  IonItem, IonLabel, IonList,
  IonNote,
  IonSearchbar,
  IonSkeletonText,
  IonSpinner,
  IonTitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward, personCircle } from 'ionicons/icons';
import { ProfileMenuComponent } from 'src/app/components/profile-menu/profile-menu.component';
import { InventarioStockRowDto, LaravelPaginatorMeta } from 'src/app/models/inventario.model';
import { GerencialInventarioService } from 'src/app/services/gerencial-inventario.service';

@Component({
  selector: 'app-gerencial-inventario',
  templateUrl: './gerencial-inventario.page.html',
  styleUrls: ['./gerencial-inventario.page.scss'],
  standalone:true,
  imports:[
    IonContent,IonHeader,ProfileMenuComponent,IonTitle,IonList,IonItem,IonLabel,IonSearchbar,IonNote,IonInfiniteScroll,
    IonInfiniteScrollContent,IonSkeletonText,FormsModule,CommonModule,IonIcon,IonSpinner,IonBadge,
  ]
})
export class GerencialInventarioPage implements OnInit {
  loading = false;
  rows: InventarioStockRowDto[] = [];

  // filtros
  almacenId: number | null = null;
  q = '';
  minimos: 0 | 1 = 0;

  // paginación
  meta: LaravelPaginatorMeta | null = null;
  page = 1;
  perPage = 25;

  constructor(
    private api: GerencialInventarioService,
    private nav: NavController,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    addIcons ({chevronBack,chevronForward,personCircle})
  }

  ngOnInit() {
    this.reload();
  }

 reload() {
  this.loading = true;
  this.page = 1;

  this.api.stock({
    almacen_id: this.almacenId ?? undefined,
    q: (this.q ?? '').trim() || undefined,
    minimos: this.minimos,
    page: this.page,
    per_page: this.perPage,
  }).subscribe({
    next: (res) => {
      this.rows = res.data ?? [];
      this.meta = res.meta ?? null;
      this.loading = false;
    },
    error: () => this.loading = false
  });
}

  loadMore(ev: any) {
    if (!this.meta) {
      ev?.target?.complete();
      return;
    }

    if (this.page >= this.meta.last_page) {
      ev?.target?.complete();
      ev.target.disabled = true;
      return;
    }

    this.page += 1;

    this.api.stock({
      almacen_id: this.almacenId ?? undefined,
      q: this.q?.trim() || undefined,
      minimos: this.minimos,
      page: this.page,
      per_page: this.perPage,
    }).subscribe({
      next: (res) => {
        this.rows = [...this.rows, ...(res.data ?? [])];
        this.meta = res.meta ?? this.meta;
        ev?.target?.complete();
      },
      error: () => ev?.target?.complete(),
    });
  }

openProducto(row: InventarioStockRowDto) {
  const productoId = row.producto?.id;
  if (!productoId) return;

  this.router.navigate(['producto', productoId], {
    relativeTo: this.route,
    queryParams: { almacen_id: this.almacenId ?? null },
  });
}

  trackById(_: number, r: InventarioStockRowDto) {
    return r.id;
  }
  getStockBadgeClass(r: any): string {
  const actual = Number(r?.stock?.stock_actual ?? 0);
  const minimo = r?.stock?.stock_minimo;

  if (actual <= 0) return 'badge-zero';
  if (minimo !== null && minimo !== undefined && actual <= Number(minimo)) return 'badge-low';
  return 'badge-ok';
}

getStockBadgeText(r: any): string {
  const actual = Number(r?.stock?.stock_actual ?? 0);
  const minimo = r?.stock?.stock_minimo;

  if (actual <= 0) return 'Sin stock';
  if (minimo !== null && minimo !== undefined && actual <= Number(minimo)) return 'Bajo mínimo';
  return 'Disponible';
}
}