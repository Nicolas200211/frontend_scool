export interface Asignatura {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  creadoEn: string;
}

export interface CrearAsignaturaDto {
  nombre: string;
  codigo: string;
  descripcion?: string;
}
