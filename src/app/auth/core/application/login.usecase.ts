import { inject, Injectable } from '@angular/core';
import { AuthRepository } from '../domain/ports/auth.repository';
import { CredencialesLogin } from '../domain/models/usuario.model';
import { AuthState } from '../../infrastructure/state/auth.state';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  private readonly authRepository = inject(AuthRepository);
  private readonly authState = inject(AuthState);

  async ejecutar(credenciales: CredencialesLogin): Promise<RespuestaApi<void>> {
    const respuesta = await this.authRepository.iniciarSesion(credenciales);

    if (respuesta.error !== null) {
      return { datos: null, error: respuesta.error };
    }

    this.authState.establecerSesion(respuesta.datos);
    return { datos: undefined, error: null };
  }
}
