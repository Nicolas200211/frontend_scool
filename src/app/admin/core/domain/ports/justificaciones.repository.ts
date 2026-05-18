import { Justificacion } from '../models/justificacion.model';
import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';

export abstract class JustificacionesRepository {
  abstract obtenerTodas(): Promise<RespuestaApi<Justificacion[]>>;
  abstract obtenerPorDocente(docenteId: string): Promise<RespuestaApi<Justificacion[]>>;
  abstract actualizarEstado(id: string, estado: 'aprobado' | 'rechazado'): Promise<RespuestaApi<void>>;
}
