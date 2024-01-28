import { Routes } from '@angular/router';
import { LayoutComponent } from './core/components/layout/layout.component';
import { secureInnerPageGuard } from './core/guards/secure-inner-page.guard';
import { SignInComponent } from './features/sign-in/sign-in.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivateChild: [secureInnerPageGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./features/ledger/ledger.routes').then(m => m.LEDGER_ROUTES)
      },
      {
        path: 'setting',
        loadChildren: () => import('./features/setting/setting.routes').then(m => m.SETTING_ROUTES)
      },
    ],
  },
  {
    path: 'signIn',
    component: SignInComponent
  }
];


