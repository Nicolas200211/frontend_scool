import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';
import { AsistenciaHijo } from '../models/asistencia-hijo.model';
import { HijoInfo } from '../models/hijo-info.model';
import { Justificacion, EnviarJustificacionDto } from '../models/justificacion.model';

export abstract class PadreRepository {
  abstract obtenerHijos(usuarioId: string): Promise<RespuestaApi<HijoInfo[]>>;
  abstract obtenerAsistenciaHijo(estudianteId: string, fechaDesde: string, fechaHasta: string): Promise<RespuestaApi<AsistenciaHijo[]>>;
  abstract obtenerJustificaciones(apoderadoId: string): Promise<RespuestaApi<Justificacion[]>>;
  abstract enviarJustificacion(dto: EnviarJustificacionDto): Promise<RespuestaApi<void>>;
}
