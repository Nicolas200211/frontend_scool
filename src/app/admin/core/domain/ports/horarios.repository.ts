import { Horario, CrearHorarioDto } from '../models/horario.model';
import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';

export abstract class HorariosRepository {
  abstract obtenerTodos(): Promise<RespuestaApi<Horario[]>>;
  abstract crear(dto: CrearHorarioDto): Promise<RespuestaApi<Horario>>;
  abstract actualizar(id: string, dto: Partial<CrearHorarioDto>): Promise<RespuestaApi<Horario>>;
  abstract eliminar(id: string): Promise<RespuestaApi<void>>;
}
