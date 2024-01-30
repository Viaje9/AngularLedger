import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { HammerModule } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Auth, getAuth, onAuthStateChanged, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'hammerjs';

/**
 * https://github.com/angular/angular/issues/50447#issuecomment-1561531221
 */

export function initData(auth: Auth) {
  return async () => new Promise((resolve, reject) => onAuthStateChanged(auth, () => resolve(true), (err) => reject(err)))
}

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(provideFirebaseApp(() => initializeApp(environment.firebaseConfig))),
    importProvidersFrom(provideFirestore(() => getFirestore())),
    importProvidersFrom(provideAuth(() => getAuth())),
    // importProvidersFrom(provideDatabase(() => getDatabase()))
    {
      provide: APP_INITIALIZER,
      useFactory: initData,
      deps: [Auth],
      multi: true
    },
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(HammerModule),
  ]
};
