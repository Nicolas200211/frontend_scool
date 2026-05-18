import { HorarioHoy, RegistrarAsistenciaDto, RegistroAsistencia, RegistroAsistenciaAdmin, ResumenAsistencia } from '../models/asistencia.model';
import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';

export abstract class AsistenciaRepository {
  abstract obtenerHorariosHoy(docenteId: string, fecha: string): Promise<RespuestaApi<HorarioHoy[]>>;
  abstract obtenerListaAsistencia(horarioId: string, fecha: string): Promise<RespuestaApi<RegistroAsistencia[]>>;
  abstract guardarAsistencia(registros: RegistrarAsistenciaDto[]): Promise<RespuestaApi<void>>;
  abstract obtenerIdDocente(usuarioId: string): Promise<string | null>;
  abstract obtenerRegistrosAdmin(fechaDesde: string, fechaHasta: string, seccionId?: string): Promise<RespuestaApi<RegistroAsistenciaAdmin[]>>;
  abstract obtenerResumenHoy(fecha: string): Promise<RespuestaApi<ResumenAsistencia>>;
}
