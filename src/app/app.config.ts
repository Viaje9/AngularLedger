import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { HammerModule } from '@angular/platform-browser';
import 'hammerjs';


/**
 * https://github.com/angular/angular/issues/50447#issuecomment-1561531221
 */

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideServiceWorker('ngsw-worker.js', {
    enabled: !isDevMode(),
    registrationStrategy: 'registerWhenStable:30000'
  }),
  importProvidersFrom(HammerModule)]
};
