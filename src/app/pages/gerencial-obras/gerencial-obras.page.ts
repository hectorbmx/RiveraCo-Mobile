import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IonContent, IonFooter,
  IonHeader, IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonSearchbar,
  IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircle } from 'ionicons/icons';
import { ProfileMenuComponent } from 'src/app/components/profile-menu/profile-menu.component';
import { ObraListItemDTO } from 'src/app/models/gerencial/obras.dto';
import { GerencialObrasService } from 'src/app/services/gerencial-obras.service';
@Component({
  selector: 'app-gerencial-obras',
  templateUrl: './gerencial-obras.page.html',
  styleUrls: ['./gerencial-obras.page.scss'],
  standalone: true,
  imports: [IonInfiniteScrollContent,IonItem,IonLabel, IonInfiniteScroll, IonIcon, IonContent, IonHeader, IonTitle, IonList,
    IonToolbar,IonFooter, CommonModule,IonRefresher, FormsModule,ProfileMenuComponent,IonSearchbar]
})
export class GerencialObrasPage {
  obras: ObraListItemDTO[] = [];
  loading = false;

  // paging
  page = 1;
  perPage = 20;
  lastPage = 1;

  // filtros
  q = '';
  estatus?: number;

  constructor(
    private obrasApi: GerencialObrasService,
    private router: Router,
      private route: ActivatedRoute,
  ) {
    addIcons({personCircle})
  }

  ionViewWillEnter() {
    this.refresh();
  }

  refresh(event?: any) {
    this.page = 1;
    this.obras = [];
    this.fetchPage(event);
  }

  fetchPage(event?: any) {
    this.loading = true;

    this.obrasApi.index({
      page: this.page,
      per_page: this.perPage,
      q: this.q?.trim() || undefined,
      estatus: this.estatus ?? undefined,
    }).subscribe({
      next: (res) => {
        const items = res.data.data ?? [];
        this.obras = this.page === 1 ? items : [...this.obras, ...items];

        this.lastPage = res.meta?.last_page ?? res.data.last_page ?? 1;

        this.loading = false;
        event?.target?.complete?.();
      },
      error: (err) => {
        console.error('Obras index error', err);
        this.loading = false;
        event?.target?.complete?.();
      }
    });
  }

  loadMore(event: any) {
    if (this.page >= this.lastPage) {
      event.target.disabled = true;
      event.target.complete();
      return;
    }
    this.page += 1;
    this.fetchPage(event);
  }

onSearchChange(value?: string | null) {
  this.q = value ?? '';
  this.refresh();
}
// goToDetalle(o: ObraListItemDTO) {
//   // this.router.navigate(['/gerencial/obras-detalles', o.id]); // ajusta tu ruta real
//   // o: this.router.navigate([`/gerencial/obras/${o.id}`]);
//   this.router.navigate(['/tabs-gerencial/obras-detalles', o.id]);

// }
goToDetalle(o: ObraListItemDTO) {
  // ✅ Relativo al tab actual
  this.router.navigate(['../obras-detalles', o.id], { relativeTo: this.route });
}
}
