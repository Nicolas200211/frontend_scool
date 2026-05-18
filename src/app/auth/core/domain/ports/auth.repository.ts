import { CredencialesLogin, SesionActiva } from '../models/usuario.model';
import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';

export abstract class AuthRepository {
  abstract iniciarSesion(credenciales: CredencialesLogin): Promise<RespuestaApi<SesionActiva>>;
  abstract cerrarSesion(token: string): Promise<void>;
}
