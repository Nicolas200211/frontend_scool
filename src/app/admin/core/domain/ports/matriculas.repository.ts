import { Matricula, CrearMatriculaDto } from '../models/matricula.model';
import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';

export abstract class MatriculasRepository {
  abstract obtenerTodas(): Promise<RespuestaApi<Matricula[]>>;
  abstract crear(dto: CrearMatriculaDto): Promise<RespuestaApi<Matricula>>;
  abstract actualizar(id: string, dto: Partial<CrearMatriculaDto>): Promise<RespuestaApi<Matricula>>;
  abstract eliminar(id: string): Promise<RespuestaApi<void>>;
}
