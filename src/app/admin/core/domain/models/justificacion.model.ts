export type EstadoJustificacion = 'pendiente' | 'aprobado' | 'rechazado';

export interface Justificacion {
  id: string;
  asistenciaId: string;
  apoderadoId: string;
  motivo: string;
  archivoUrl: string | null;
  estado: EstadoJustificacion;
  creadoEn: string;
  fecha: string;
  asignaturaNombre: string;
  estudianteNombre: string;
  estudianteApellido: string;
  apoderadoNombre: string;
}
