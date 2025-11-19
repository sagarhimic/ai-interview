import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNgToast } from 'ng-angular-popup';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        loadingInterceptor
      ])
    ),
    provideNgToast({
      duration: 5000,              // Default 5 seconds
      //position: 'top-right',       // Default position
      maxToasts: 3,                // Max 3 toasts at once
      width: 400,                  // Toast width in pixels
      showProgress: true,          // Show progress bar
      dismissible: true,           // Allow manual dismiss
      showIcon: true,              // Show icons
      enableAnimations: true       // Enable animations
    }),
  ]
};
