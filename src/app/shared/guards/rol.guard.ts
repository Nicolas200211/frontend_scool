import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../domain/types/rol.type';
import { AuthState } from '../../auth/infrastructure/state/auth.state';

export const rolGuard = (rolesPermitidos: Rol[]): CanActivateFn => {
  return () => {
    const authState = inject(AuthState);
    const router = inject(Router);

    const rolUsuario = authState.rolUsuario();

    if (rolUsuario && rolesPermitidos.includes(rolUsuario)) {
      return true;
    }

    return router.createUrlTree(['/sin-acceso']);
  };
};
