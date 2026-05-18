export interface Docente {
  id: string;
  usuarioId: string;
  especialidad: string | null;
  nombre: string;
  apellido: string;
  email: string;
  creadoEn: string;
}

export interface CrearDocenteDto {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  especialidad?: string;
}
