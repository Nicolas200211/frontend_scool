export interface RespuestaExitosa<T> {
  datos: T;
  error: null;
}

export interface RespuestaError {
  datos: null;
  error: string;
}

export type RespuestaApi<T> = RespuestaExitosa<T> | RespuestaError;
