import { Injectable, inject } from '@angular/core';
import { Router, type CanActivateChildFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const secureInnerPageGuard: CanActivateChildFn = () => {
  const auth = inject(AuthService)
  const router = inject(Router)

  return auth.isSignedIn().then(signedIn =>
    signedIn ? true : router.createUrlTree(['/signIn'])
  );
};

