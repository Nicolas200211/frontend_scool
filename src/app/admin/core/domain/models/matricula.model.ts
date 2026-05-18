export type EstadoMatricula = 'activo' | 'retirado' | 'trasladado';

export interface Matricula {
  id: string;
  estudianteId: string;
  seccionId: string;
  anioAcademico: number;
  estado: EstadoMatricula;
  estudianteCodigo: string;
  estudianteNombre: string;
  estudianteApellido: string;
  estudianteFotoUrl: string | null;
  seccionNombre: string;
  gradoNombre: string;
  creadoEn: string;
}

export interface CrearMatriculaDto {
  estudianteId: string;
  seccionId: string;
  anioAcademico: number;
  estado: EstadoMatricula;
}
