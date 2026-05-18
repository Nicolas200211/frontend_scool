export type EstadoAsistencia = 'presente' | 'ausente' | 'tardanza' | 'justificado';

export interface RegistroAsistenciaAdmin {
  id: string;
  fecha: string;
  estado: EstadoAsistencia;
  observacion: string | null;
  estudianteNombre: string;
  estudianteApellido: string;
  estudianteCodigo: string;
  asignaturaNombre: string;
  seccionNombre: string;
  gradoNombre: string;
  horaInicio: string;
  horaFin: string;
}

export interface ResumenAsistencia {
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
}

export interface RegistroAsistencia {
  matriculaId: string;
  estudianteCodigo: string;
  estudianteNombre: string;
  estudianteApellido: string;
  estado: EstadoAsistencia | null;
  observacion: string | null;
  asistenciaId: string | null;
}

export interface RegistrarAsistenciaDto {
  matriculaId: string;
  horarioId: string;
  fecha: string;
  estado: EstadoAsistencia;
  observacion?: string;
}

export interface HorarioHoy {
  id: string;
  seccionId: string;
  asignaturaNombre: string;
  seccionNombre: string;
  gradoNombre: string;
  horaInicio: string;
  horaFin: string;
  asistenciaTomada: boolean;
}
