import { APP_BASE_HREF } from '@angular/common';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
} from '@angular/core';
import { getApp, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  Auth,
  getAuth,
  onAuthStateChanged,
  provideAuth,
} from '@angular/fire/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  provideFirestore,
} from '@angular/fire/firestore';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { HammerModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import 'hammerjs';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

/**
 * https://github.com/angular/angular/issues/50447#issuecomment-1561531221
 */

export function initData(auth: Auth) {
  return async () =>
    new Promise((resolve, reject) =>
      onAuthStateChanged(
        auth,
        () => resolve(true),
        (err) => reject(err),
      ),
    );
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: APP_BASE_HREF, useValue: environment.baseUrl },
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() =>
      initializeFirestore(getApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      }),
    ),
    provideAuth(() => getAuth()),
    {
      provide: APP_INITIALIZER,
      useFactory: initData,
      deps: [Auth],
      multi: true,
    },
    provideRouter(routes),
    provideMessaging(() => getMessaging()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(HammerModule),
  ],
};
