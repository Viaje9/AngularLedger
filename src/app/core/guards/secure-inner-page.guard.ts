import { Injectable, inject } from '@angular/core';
import { Router, type CanActivateChildFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const secureInnerPageGuard: CanActivateChildFn = () => {
  const auth = inject(AuthService)
  const router = inject(Router)

  if (!auth.isSignedIn()) {
    router.navigateByUrl('/signIn')
    return false;
  }
  return true;
};


