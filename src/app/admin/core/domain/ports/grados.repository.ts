import {
  CrearGradoDto,
  CrearSeccionDto,
  Grado,
  GradoConSecciones,
  Seccion,
} from '../models/grado.model';
import { RespuestaApi } from '../../../../shared/domain/types/respuesta-api.type';

export abstract class GradosRepository {
  abstract obtenerTodos(): Promise<RespuestaApi<GradoConSecciones[]>>;
  abstract crear(dto: CrearGradoDto): Promise<RespuestaApi<Grado>>;
  abstract actualizar(id: string, dto: Partial<CrearGradoDto>): Promise<RespuestaApi<Grado>>;
  abstract eliminar(id: string): Promise<RespuestaApi<void>>;
  abstract crearSeccion(dto: CrearSeccionDto): Promise<RespuestaApi<Seccion>>;
  abstract actualizarSeccion(id: string, dto: Partial<CrearSeccionDto>): Promise<RespuestaApi<Seccion>>;
  abstract eliminarSeccion(id: string): Promise<RespuestaApi<void>>;
}
