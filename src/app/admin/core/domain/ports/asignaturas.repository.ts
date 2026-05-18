import { Asignatura, CrearAsignaturaDto } from '../models/asignatura.model';
import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';

export abstract class AsignaturasRepository {
  abstract obtenerTodas(): Promise<RespuestaApi<Asignatura[]>>;
  abstract crear(dto: CrearAsignaturaDto): Promise<RespuestaApi<Asignatura>>;
  abstract actualizar(id: string, dto: Partial<CrearAsignaturaDto>): Promise<RespuestaApi<Asignatura>>;
  abstract eliminar(id: string): Promise<RespuestaApi<void>>;
}
