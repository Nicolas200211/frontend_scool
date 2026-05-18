import { computed, Injectable, signal } from '@angular/core';
import { SesionActiva, Usuario } from '../../core/domain/models/usuario.model';
import { Rol } from '../../../shared/domain/types/rol.type';

const CLAVE_SESION = 'sesion_colegio';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly sesion = signal<SesionActiva | null>(this.cargarSesionGuardada());

  readonly estaAutenticado = computed(() => this.sesion() !== null);
  readonly usuarioActual = computed<Usuario | null>(() => this.sesion()?.usuario ?? null);
  readonly rolUsuario = computed<Rol | null>(() => this.sesion()?.usuario.rol ?? null);
  readonly token = computed<string | null>(() => this.sesion()?.token ?? null);

  establecerSesion(sesionActiva: SesionActiva): void {
    this.sesion.set(sesionActiva);
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionActiva));
  }

  limpiarSesion(): void {
    this.sesion.set(null);
    localStorage.removeItem(CLAVE_SESION);
  }

  private cargarSesionGuardada(): SesionActiva | null {
    const sesionGuardada = localStorage.getItem(CLAVE_SESION);
    if (!sesionGuardada) return null;

    const sesion: SesionActiva = JSON.parse(sesionGuardada);
    const ahora = new Date();
    const expiracion = new Date(sesion.expiresAt);

    if (ahora >= expiracion) {
      localStorage.removeItem(CLAVE_SESION);
      return null;
    }

    return sesion;
  }
}
