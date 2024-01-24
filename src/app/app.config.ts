import { ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { HammerModule } from '@angular/platform-browser';
import 'hammerjs';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { environment } from '../environments/environment';

/**
 * https://github.com/angular/angular/issues/50447#issuecomment-1561531221
 */

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    importProvidersFrom(HammerModule),
    importProvidersFrom(provideFirebaseApp(() => initializeApp(environment.firebaseConfig))),
    // importProvidersFrom(provideAuth(() => getAuth())),
    importProvidersFrom(provideFirestore(() => getFirestore())),
    // importProvidersFrom(provideDatabase(() => getDatabase()))
  ]
};
