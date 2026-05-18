import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';
import { MiAsistencia } from '../models/mi-asistencia.model';
import { MiHorario } from '../models/mi-horario.model';
import { Anuncio } from '../models/anuncio.model';

export abstract class EstudianteRepository {
  abstract obtenerEstudianteId(usuarioId: string): Promise<string | null>;
  abstract obtenerMatriculaActiva(estudianteId: string): Promise<string | null>;
  abstract obtenerMiAsistencia(estudianteId: string, fechaDesde: string, fechaHasta: string): Promise<RespuestaApi<MiAsistencia[]>>;
  abstract obtenerMiHorario(estudianteId: string): Promise<RespuestaApi<MiHorario[]>>;
  abstract obtenerAnuncios(seccionId: string): Promise<RespuestaApi<Anuncio[]>>;
}
