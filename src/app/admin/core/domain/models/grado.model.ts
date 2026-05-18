export type Nivel = 'primaria' | 'secundaria';

export interface Grado {
  id: string;
  nombre: string;
  nivel: Nivel;
  orden: number;
  creadoEn: string;
}

export interface Seccion {
  id: string;
  gradoId: string;
  nombre: string;
  anioAcademico: number;
  creadoEn: string;
}

export interface GradoConSecciones extends Grado {
  secciones: Seccion[];
}

export interface CrearGradoDto {
  nombre: string;
  nivel: Nivel;
  orden: number;
}

export interface CrearSeccionDto {
  gradoId: string;
  nombre: string;
  anioAcademico: number;
}
