export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

export interface MiHorario {
  id: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  asignaturaNombre: string;
  docenteNombre: string;
  docenteApellido: string;
  seccionNombre: string;
  gradoNombre: string;
}
