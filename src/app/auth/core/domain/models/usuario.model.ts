import { Rol } from '../../../../shared/domain/types/rol.type';

export interface Usuario {
  id: string;
  email: string;
  rol: Rol;
  nombre: string;
  apellido: string;
  activo: boolean;
  fotoUrl?: string | null;
}

export interface CredencialesLogin {
  email: string;
  password: string;
}

export interface SesionActiva {
  usuario: Usuario;
  token: string;
  expiresAt: string;
}
