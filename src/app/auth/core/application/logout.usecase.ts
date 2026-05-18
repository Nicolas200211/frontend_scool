import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../domain/ports/auth.repository';
import { AuthState } from '../../infrastructure/state/auth.state';

@Injectable({ providedIn: 'root' })
export class LogoutUseCase {
  private readonly authRepository = inject(AuthRepository);
  private readonly authState = inject(AuthState);

  async ejecutar(): Promise<void> {
    const token = this.authState.token();
    if (token) {
      await this.authRepository.cerrarSesion(token);
    }
    this.authState.limpiarSesion();
  }
}
