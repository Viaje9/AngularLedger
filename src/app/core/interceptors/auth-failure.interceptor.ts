import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authFailureInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  return next(request).pipe(catchError(error => {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      auth.invalidate();
    }
    return throwError(() => error);
  }));
};
