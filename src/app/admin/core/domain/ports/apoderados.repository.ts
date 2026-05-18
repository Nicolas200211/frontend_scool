import { Apoderado, ApoderadoAgrupado, CrearApoderadoDto, VincularHijoDto } from '../models/apoderado.model';
import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';

export abstract class ApoderadosRepository {
  abstract obtenerTodos(): Promise<RespuestaApi<ApoderadoAgrupado[]>>;
  abstract crear(dto: CrearApoderadoDto): Promise<RespuestaApi<Apoderado>>;
  abstract vincularHijo(dto: VincularHijoDto): Promise<RespuestaApi<void>>;
  abstract desvincularHijo(apoderadoId: string): Promise<RespuestaApi<void>>;
  abstract eliminar(usuarioId: string): Promise<RespuestaApi<void>>;
}
