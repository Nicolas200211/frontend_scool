import { pgTable, pgEnum, uuid, text, integer, time, timestamp } from 'drizzle-orm/pg-core';
import { docentes } from './personas.schema';

export const nivelEnum = pgEnum('nivel', ['primaria', 'secundaria']);
export const diaSemanaEnum = pgEnum('dia_semana', [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
]);

export const grados = pgTable('grados', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  nivel: nivelEnum('nivel').notNull(),
  orden: integer('orden').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});

export const secciones = pgTable('secciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  gradoId: uuid('grado_id')
    .notNull()
    .references(() => grados.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  anioAcademico: integer('anio_academico').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});

export const asignaturas = pgTable('asignaturas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  codigo: text('codigo').notNull().unique(),
  descripcion: text('descripcion'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});

export const horarios = pgTable('horarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  seccionId: uuid('seccion_id')
    .notNull()
    .references(() => secciones.id, { onDelete: 'cascade' }),
  asignaturaId: uuid('asignatura_id')
    .notNull()
    .references(() => asignaturas.id),
  docenteId: uuid('docente_id')
    .notNull()
    .references(() => docentes.id),
  diaSemana: diaSemanaEnum('dia_semana').notNull(),
  horaInicio: time('hora_inicio').notNull(),
  horaFin: time('hora_fin').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});

export const anuncios = pgTable('anuncios', {
  id: uuid('id').primaryKey().defaultRandom(),
  docenteId: uuid('docente_id')
    .notNull()
    .references(() => docentes.id, { onDelete: 'cascade' }),
  seccionId: uuid('seccion_id')
    .notNull()
    .references(() => secciones.id, { onDelete: 'cascade' }),
  tipo: text('tipo').notNull(),
  titulo: text('titulo').notNull(),
  mensaje: text('mensaje').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});

export const comunicados = pgTable('comunicados', {
  id: uuid('id').primaryKey().defaultRandom(),
  audiencia: text('audiencia').notNull(),
  importancia: text('importancia').notNull(),
  titulo: text('titulo').notNull(),
  mensaje: text('mensaje').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});
