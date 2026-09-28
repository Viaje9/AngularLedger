import { APP_BASE_HREF } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { HammerModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import 'hammerjs';
import { client } from './api/generated/client.gen';
import { provideHeyApiClient } from './api/generated/client/client.gen';
import { routes } from './app.routes';
import { authFailureInterceptor } from './core/interceptors/auth-failure.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: APP_BASE_HREF, useValue: '/' },
    provideHttpClient(withFetch(), withInterceptors([authFailureInterceptor])),
    provideHeyApiClient(client),
    provideRouter(routes),
    importProvidersFrom(BrowserAnimationsModule, HammerModule),
  ],
};
