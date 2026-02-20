import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonAvatar,
  IonBackButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { add, peopleCircle, person, personCircle } from 'ionicons/icons';

import { AreaDto, EmpleadoListItemDto } from 'src/app/models/empleado.model';
import { GerencialPersonalService } from 'src/app/services/gerencial-personal.service';

@Component({
  selector: 'app-gerencial-empleados',
  templateUrl: './gerencial-empleados.page.html',
  styleUrls: ['./gerencial-empleados.page.scss'],
  standalone: true,
  imports: [IonSegmentButton, IonBackButton, IonAvatar, 
    IonFabButton, IonFab,IonSegment,IonSelect,IonSelectOption,
    IonInfiniteScrollContent, IonInfiniteScroll,
    IonItem, IonLabel, IonList,
    IonIcon, IonContent,
    IonHeader, IonTitle, IonToolbar, IonFooter,
    IonRefresher, IonRefresherContent,
    IonSearchbar,
    CommonModule, FormsModule
  ]
})
export class GerencialEmpleadosPage implements OnInit {
@ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;
  showTabs = true;
  lastScrollTop = 0;
  areas: AreaDto[] = [];
  areaId: number | null = null;
  items: EmpleadoListItemDto[] = [];
  meta: any = null;
private reqSeq = 0;
  // filtros básicos
  q = '';

  // control de carga
  loading = false;
  page = 1;
  perPage = 25;
  status: 1 | 2 | null = 1;   // 👈 default activos
  constructor(
    private personalSvc: GerencialPersonalService,
    private router: Router,
    ) {
    addIcons({personCircle,peopleCircle,person,add});
  }

  ngOnInit() {
    this.loadFirstPage();
      this.loadAreas();
  }

  loadFirstPage() {
    this.page = 1;
    this.items = [];
    this.meta = null;
    if (this.infiniteScroll) {
      this.infiniteScroll.disabled = false;
    }
    this.fetchPage();
  }
loadAreas() {
  this.personalSvc.areas().subscribe({
    next: (res) => this.areas = Array.isArray(res.data) ? res.data : [],
    error: (err) => console.error('Error areas:', err),
  });
}
fetchPage(event?: any) {
  if (this.loading) return;
  this.loading = true;

  const params: any = {
    q: this.q?.trim() || undefined,
    page: this.page,
    per_page: this.perPage,
    area_id: this.areaId || undefined
  };

  // Solo agregar status si es 1 o 2. Si es null (Todos), no se envía la llave.
  if (this.status === 1 || this.status === 2) {
    params.status = this.status;
  }

  this.personalSvc.index(params).subscribe({
    next: (res: any) => {
      const list = Array.isArray(res.data) ? res.data : [];
      
      if (this.page === 1) this.items = list;
      else this.items = [...this.items, ...list];

      this.meta = res.meta;

      // ✅ Validar si ya no hay más páginas después de actualizar los items
      if (this.meta && this.meta.current_page >= this.meta.last_page) {
        if (this.infiniteScroll) this.infiniteScroll.disabled = true;
      }
    },
    error: (err) => {
      console.error('Error:', err);
      if (event) event.target.complete();
    },
    complete: () => {
      this.loading = false;
      if (event) event.target.complete();
    },
  });
}


onSearchChange(value: string | null | undefined) {
    this.q = (value ?? '').trim();
    this.loadFirstPage();
  }


  // ✅ Infinite scroll del HTML: (ionInfinite)="loadMore($event)"
loadMore(ev: any) {
  const inf = ev.target as HTMLIonInfiniteScrollElement;

  if (this.loading || !this.meta) {
    inf.complete();
    return;
  }

  const current = Number(this.meta.current_page ?? 1);
  const last = Number(this.meta.last_page ?? 1);

  if (current >= last) {
    inf.complete();
    return;
  }

  this.page = current + 1;

  // 👇 IMPORTANTE: aquí sí ponemos loading para que no se dispare doble
  this.loading = true;

  const params: any = {
    q: this.q?.trim() || undefined,
    page: this.page,
    per_page: this.perPage,
  };

  if (this.status === 1 || this.status === 2) {
    params.status = this.status;
  }

  this.personalSvc.index(params).subscribe({
    next: (res: any) => {
      const list = Array.isArray(res.data) ? res.data : [];
      this.items = [...this.items, ...list];
      this.meta = res.meta;
    },
    error: (err) => console.error('Error loadMore:', err),
    complete: () => {
      this.loading = false;
      inf.complete();
    }
  });
}
  // -------- Helpers UI (para el HTML nuevo) --------

getInitials(nombre_completo?: string): string {
  // Aquí usamos directamente el string, no el objeto
  if (!nombre_completo) return '??';
  const parts = nombre_completo.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? '';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

getAreaName(e: EmpleadoListItemDto): string {
    // asumiendo e.area?.nombre como tu payload
    // si tu model difiere, ajustamos aquí
    return (e as any)?.area?.nombre ?? 'Sin área';
  }

getObraName(e: any): string {
  const obra = e.obra_actual;
  
  if (obra) {
    // Si tiene clave, la mostramos así: "ABC-123 - Nombre de la Obra"
    // Si no tiene clave, solo el nombre.
    const clave = obra.clave_obra ? `${obra.clave_obra} - ` : '';
    return `${clave}${obra.nombre}`;
  }
  
  return 'Sin obra asignada';
}
  goToDetalle(e: EmpleadoListItemDto) {
    // aquí navegas si ya tienes ruta de detalle
    // this.router.navigate(['gerencial', 'empleados', e.id]);
    console.log('Empleado:', (e as any)?.id);
    
    this.router.navigate(['tabs-gerencial', 'empleado-detalles', e.id]);
  }

onStatusChange(val: any) {
  // Aseguramos la conversión limpia
  if (val === null || val === 'null' || val === '') {
    this.status = null; 
  } else {
    this.status = Number(val) as 1 | 2;
  }

  this.loadFirstPage(); // Esto ahora limpia la lista y reactiva el scroll
}
onContentScroll(event: any) {
  const scrollTop = event.detail.scrollTop;

  // Si el scroll es mayor a 50px (para evitar rebotes accidentales)
  if (scrollTop > this.lastScrollTop && scrollTop > 50) {
    // Scroll hacia ABAJO -> Ocultar
    this.showTabs = false;
    this.toggleTabs('hide');
  } else {
    // Scroll hacia ARRIBA -> Mostrar
    this.showTabs = true;
    this.toggleTabs('show');
  }

  this.lastScrollTop = scrollTop;
}

private toggleTabs(action: 'show' | 'hide') {
  const tabBar = document.querySelector('ion-tab-bar');
  if (tabBar) {
    if (action === 'hide') {
      tabBar.style.transition = '0.3s ease-in-out';
      tabBar.style.transform = 'translateY(100%)'; // Lo manda hacia abajo fuera de la pantalla
    } else {
      tabBar.style.transform = 'translateY(0)'; // Lo regresa a su posición original
    }
  }
}

}
