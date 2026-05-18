import { RespuestaApi } from '../types/respuesta-api.type';
import { Comunicado } from '../models/comunicado.model';

export abstract class ComunicadosRepository {
  abstract obtenerPorAudiencia(audiencia: string): Promise<RespuestaApi<Comunicado[]>>;
  abstract crear(comunicado: Omit<Comunicado, 'id' | 'creadoEn'>): Promise<RespuestaApi<void>>;
}
