export interface Estudiante {
  id: string;
  usuarioId: string;
  codigo: string;
  fechaNacimiento: string | null;
  direccion: string | null;
  fotoUrl: string | null;
  nombre: string;
  apellido: string;
  email: string;
  creadoEn: string;
}

export interface CrearEstudianteDto {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  codigo: string;
  fechaNacimiento?: string;
  direccion?: string;
}
