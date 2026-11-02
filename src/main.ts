import { navegacionLoadingInterceptor } from './app/interceptors/navegacion-loading.interceptor';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { mecanicoLoadingInterceptor } from './app/interceptors/mecanico-loading.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      swipeBackEnabled: false,
    }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([mecanicoLoadingInterceptor, navegacionLoadingInterceptor]))
  ],
});
