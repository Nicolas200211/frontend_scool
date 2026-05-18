export type EstadoAsistencia = 'presente' | 'ausente' | 'tardanza' | 'justificado';

export interface AsistenciaHijo {
  id: string;
  asistenciaId: string;
  fecha: string;
  estado: EstadoAsistencia;
  observacion: string | null;
  asignaturaNombre: string;
  horaInicio: string;
  horaFin: string;
  seccionNombre: string;
  gradoNombre: string;
  tieneJustificacion: boolean;
}
