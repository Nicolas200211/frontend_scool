import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthState } from '../../auth/infrastructure/state/auth.state';

export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthState);
  const router = inject(Router);

  if (authState.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
