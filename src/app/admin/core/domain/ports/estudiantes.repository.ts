import { Estudiante, CrearEstudianteDto } from '../models/estudiante.model';
import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';

export abstract class EstudiantesRepository {
  abstract obtenerTodos(): Promise<RespuestaApi<Estudiante[]>>;
  abstract crear(dto: CrearEstudianteDto): Promise<RespuestaApi<Estudiante>>;
  abstract actualizar(id: string, dto: Partial<CrearEstudianteDto>): Promise<RespuestaApi<Estudiante>>;
  abstract eliminar(id: string): Promise<RespuestaApi<void>>;
}
