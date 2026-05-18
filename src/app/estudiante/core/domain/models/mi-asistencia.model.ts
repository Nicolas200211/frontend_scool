export type EstadoAsistencia = 'presente' | 'ausente' | 'tardanza' | 'justificado';

export interface MiAsistencia {
  id: string;
  fecha: string;
  estado: EstadoAsistencia;
  observacion: string | null;
  asignaturaNombre: string;
  horaInicio: string;
  horaFin: string;
  seccionNombre: string;
  gradoNombre: string;
}
