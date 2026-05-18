export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

export interface Horario {
  id: string;
  seccionId: string;
  asignaturaId: string;
  docenteId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  seccionNombre: string;
  gradoNombre: string;
  asignaturaNombre: string;
  docenteNombre: string;
  creadoEn: string;
}

export interface CrearHorarioDto {
  seccionId: string;
  asignaturaId: string;
  docenteId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}
