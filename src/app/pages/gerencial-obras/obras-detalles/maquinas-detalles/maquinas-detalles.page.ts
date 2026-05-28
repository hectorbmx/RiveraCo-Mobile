import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonBackButton, IonContent, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, informationCircleOutline, speedometerOutline, timeOutline } from 'ionicons/icons';
import { GerencialObrasService } from 'src/app/services/gerencial-obras.service';
@Component({
  selector: 'app-maquinas-detalles',
  templateUrl: './maquinas-detalles.page.html',
  styleUrls: ['./maquinas-detalles.page.scss'],
  standalone: true,
  imports: [IonInfiniteScroll, IonContent, IonIcon, IonSpinner,  CommonModule, FormsModule, IonInfiniteScrollContent, IonBackButton]
})

export class MaquinasDetallesPage implements OnInit {
  loading = true;

  obraId!: number;
  maquinaId!: number;
  returnObraId?: number;
  hasNotas = false;

  maquina: any = null;
  notas: any = null;
  asignacion: any = null;
  registros: any[] = [];

  page =1;
  lastPage = 1;


  constructor(
    private route: ActivatedRoute,
    private srv: GerencialObrasService,
    private router: Router
  ) { 
    addIcons({chevronBack,speedometerOutline,timeOutline,informationCircleOutline});
  }

  ngOnInit() {
    this.obraId = Number(this.route.snapshot.paramMap.get('id')); // no lo usamos aún, pero queda para breadcrumb
    this.maquinaId = Number(this.route.snapshot.paramMap.get('maquinaId'));
    const returnObraId = Number(this.route.snapshot.queryParamMap.get('returnObraId'));
    this.returnObraId = returnObraId || (this.obraId || undefined);
    this.load(1, true);

    console.log(this.obraId)
  }
   load(page: number, reset = false, done?: () => void) {
    if (reset) {
      this.loading = true;
      this.registros = [];
      this.page = 1;
      this.lastPage = 1;
    }
this.srv.maquinaRegistros(this.maquinaId, page).subscribe({
      next: (resp) => {
        const d = resp?.data;
        this.maquina = d?.maquina ?? null;
        this.asignacion = d?.asignacion ?? null;
        this.notas = d?.notas ?? null;
        console.log(this.notas);

        const pag = d?.registros;
        const items = pag?.data ?? [];

        this.page = pag?.current_page ?? page;
        this.lastPage = pag?.last_page ?? 1;

        this.registros = reset ? items : [...this.registros, ...items];

        this.loading = false;
        done?.();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        done?.();
      }
    });
  }
  loadMore(ev: any) {
    const next = this.page + 1;
    if (next > this.lastPage) {
      ev.target.complete();
      ev.target.disabled = true;
      return;
    }

    this.load(next, false, () => {
      ev.target.complete();
      ev.target.disabled = this.page >= this.lastPage;
    });
  }

  goBackToObra() {
    if (this.returnObraId) {
      this.router.navigate(['/tabs-gerencial/obras-detalles', this.returnObraId]);
      return;
    }

    this.router.navigate(['/tabs-gerencial/maquinas']);
  }
}
