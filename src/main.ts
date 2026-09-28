import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

async function removeLegacyServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(registration =>
      [registration.active, registration.waiting, registration.installing].some(worker =>
        worker && new URL(worker.scriptURL).pathname === '/ngsw-worker.js'
      )
    ).map(registration => registration.unregister()));
  }
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('ngsw:/:'))
      .map(name => caches.delete(name)));
  }
}

void removeLegacyServiceWorker().catch(() => {
  // Cleanup is best effort; it must not prevent the ledger from opening.
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
