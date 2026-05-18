import { Injectable } from '@angular/core';
import { AuthRepository } from '../../core/domain/ports/auth.repository';
import { CredencialesLogin, SesionActiva } from '../../core/domain/models/usuario.model';
import { RespuestaApi } from '../../../shared/domain/types/respuesta-api.type';
import { obtenerClienteSupabase } from '../../../shared/infrastructure/supabase/supabase.client';

interface RespuestaRpcLogin {
  error?: string;
  usuario?: SesionActiva['usuario'];
  token?: string;
  expiresAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseAuthRepository implements AuthRepository {
  private readonly supabase = obtenerClienteSupabase();

  async iniciarSesion(credenciales: CredencialesLogin): Promise<RespuestaApi<SesionActiva>> {
    const { data, error } = await this.supabase.rpc('iniciar_sesion', {
      p_email: credenciales.email,
      p_password: credenciales.password,
    });

    if (error) {
      return { datos: null, error: 'Error de conexión. Intenta de nuevo.' };
    }

    const respuesta = data as RespuestaRpcLogin;

    if (respuesta.error) {
      return { datos: null, error: respuesta.error };
    }

    return {
      datos: {
        usuario: {
          ...respuesta.usuario!,
          fotoUrl: (respuesta.usuario as any).foto_url || (respuesta.usuario as any).fotoUrl || null,
        },
        token: respuesta.token!,
        expiresAt: respuesta.expiresAt!,
      },
      error: null,
    };
  }

  async cerrarSesion(token: string): Promise<void> {
    await this.supabase.rpc('cerrar_sesion', { p_token: token });
  }
}
