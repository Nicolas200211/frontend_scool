import { Docente, CrearDocenteDto } from '../models/docente.model';
import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';

export abstract class DocentesRepository {
  abstract obtenerTodos(): Promise<RespuestaApi<Docente[]>>;
  abstract crear(dto: CrearDocenteDto): Promise<RespuestaApi<Docente>>;
  abstract actualizar(id: string, especialidad: string): Promise<RespuestaApi<Docente>>;
  abstract eliminar(id: string): Promise<RespuestaApi<void>>;
}
