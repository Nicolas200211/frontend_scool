export interface Docente {
  id: string;
  usuarioId: string;
  especialidad: string | null;
  nombre: string;
  apellido: string;
  email: string;
  fotoUrl: string | null;
  creadoEn: string;
}

export interface CrearDocenteDto {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  especialidad?: string;
}
