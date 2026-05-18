export interface Apoderado {
  id: string;
  usuarioId: string;
  estudianteId: string;
  parentesco: string;
  nombre: string;
  apellido: string;
  email: string;
  estudianteNombre: string;
  estudianteApellido: string;
  estudianteCodigo: string;
}

export interface ApoderadoAgrupado {
  usuarioId: string;
  nombre: string;
  apellido: string;
  email: string;
  hijos: { apoderadoId: string; estudianteId: string; estudianteNombre: string; estudianteApellido: string; estudianteCodigo: string; parentesco: string }[];
}

export interface CrearApoderadoDto {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  estudianteId: string;
  parentesco: string;
}

export interface VincularHijoDto {
  usuarioId: string;
  estudianteId: string;
  parentesco: string;
}
