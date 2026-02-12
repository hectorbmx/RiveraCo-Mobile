import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonFooter, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
// import { GerencialDashboardService } from 'src/app/services/gerencial/gerencial-dashboard.service';
import { analytics, buildOutline, chevronForward, constructOutline, cubeOutline, notificationsOutline, people, personCircle } from 'ionicons/icons';
import { GerencialDashboardData } from 'src/app/models/gerencial/dashboard.dto';
import { GerencialDashboardService } from 'src/app/services/gerencial-dashboard.service';
@Component({
  selector: 'app-gerencial-home',
  templateUrl: './gerencial-home.page.html',
  styleUrls: ['./gerencial-home.page.scss'],
  standalone: true,
  imports: [IonIcon, IonContent, IonHeader, IonTitle, IonToolbar,IonFooter, CommonModule, FormsModule]
})



export class GerencialHomePage implements OnInit {
dashboard?: GerencialDashboardData;
loading =false;


  // Mock Data - Stats
  stats = {
    proyectos: {
      total: 12,
      estado: 'Activos',
      icono: 'people-outline'
    },
    empleados: {
      total: 85,
      estado: 'Presentes',
      icono: 'people'
    },
    maquinaria: {
      total: 24,
      estado: 'En Uso',
      icono: 'construct'
    },
    inventario: {
      porcentaje: 92,
      estado: 'Stock',
      icono: 'archive'
    }
  };

  // Mock Data - Quick Actions
  quickActions = [
    {
      id: 1,
      titulo: 'Ver Reporte Mensual',
      icono: 'stats-chart',
      ruta: '/reportes',
      badge: null
    },
    {
      id: 2,
      titulo: 'Alertas de Obra',
      icono: 'notifications',
      ruta: '/alertas',
      badge: 3
    }
  ];

  // Mock Data - User Info
  usuario = {
    nombre: 'Administrador',
    empresa: 'Rivera Construcciones',
    rol: 'Executive'
  };

   constructor(
    private dashApi: GerencialDashboardService
   ) {
    addIcons({
      chevronForward,
      notificationsOutline,people,cubeOutline,analytics,personCircle,constructOutline,buildOutline
    });
  }


ngOnInit() {
  console.log('Dashboard cargado con datos mock');
  this.loadDashboard();
}
ionViewWillEnter() {
  this.loadDashboard();
}

loadDashboard(event?: any) {
  this.loading = true;

  this.dashApi.getDashboard().subscribe({
    next: (res) => {
      console.log('Dashboard API response:', res);
      this.dashboard = res.data;
      console.log('Dashboard data:', this.dashboard);

      this.loading = false;
      event?.target?.complete?.();
    },
    error: (err) => {
      console.error('Dashboard API error:', err);
      this.loading = false;
      event?.target?.complete?.();
    }
  });
}

  /**
   * Navega a la página de reportes mensuales
   */
  verReporte() {
    console.log('Navegando a reportes mensuales...');
    // Aquí implementarás la navegación real
    // this.router.navigate(['/reportes']);
  }

  /**
   * Navega a la página de alertas de obra
   */
  verAlertas() {
    console.log('Navegando a alertas de obra...');
    // Aquí implementarás la navegación real
    // this.router.navigate(['/alertas']);
  }

  /**
   * Maneja el click en una tarjeta de estadística
   * @param tipo - Tipo de estadística (proyectos, empleados, maquinaria, inventario)
   */
  verDetalleEstadistica(tipo: string) {
    console.log(`Mostrando detalle de: ${tipo}`);
    // Aquí implementarás la navegación o modal con más detalles
  }

  /**
   * Navega a diferentes tabs del footer
   * @param tab - Nombre del tab (inicio, obra, comisiones, salir)
   */
  navegarTab(tab: string) {
    console.log(`Navegando a tab: ${tab}`);
    
    if (tab === 'salir') {
      this.cerrarSesion();
    } else {
      // Implementar navegación a otros tabs
      // this.router.navigate([`/${tab}`]);
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  cerrarSesion() {
    console.log('Cerrando sesión...');
    // Aquí implementarás la lógica de logout
    // this.authService.logout();
  }

}