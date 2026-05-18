import { pgTable, pgEnum, uuid, text, date, integer, timestamp } from 'drizzle-orm/pg-core';
import { estudiantes, apoderados } from './personas.schema';
import { secciones, horarios } from './academico.schema';

export const estadoMatriculaEnum = pgEnum('estado_matricula', [
  'activo',
  'retirado',
  'trasladado',
]);

export const estadoAsistenciaEnum = pgEnum('estado_asistencia', [
  'presente',
  'ausente',
  'tardanza',
  'justificado',
]);

export const estadoJustificacionEnum = pgEnum('estado_justificacion', [
  'pendiente',
  'aprobado',
  'rechazado',
]);

export const matriculas = pgTable('matriculas', {
  id: uuid('id').primaryKey().defaultRandom(),
  estudianteId: uuid('estudiante_id')
    .notNull()
    .references(() => estudiantes.id, { onDelete: 'cascade' }),
  seccionId: uuid('seccion_id')
    .notNull()
    .references(() => secciones.id),
  anioAcademico: integer('anio_academico').notNull(),
  estado: estadoMatriculaEnum('estado').default('activo').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});

export const asistencia = pgTable('asistencia', {
  id: uuid('id').primaryKey().defaultRandom(),
  matriculaId: uuid('matricula_id')
    .notNull()
    .references(() => matriculas.id, { onDelete: 'cascade' }),
  horarioId: uuid('horario_id')
    .notNull()
    .references(() => horarios.id),
  fecha: date('fecha').notNull(),
  estado: estadoAsistenciaEnum('estado').notNull(),
  observacion: text('observacion'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});

export const justificaciones = pgTable('justificaciones', {
  id: uuid('id').primaryKey().defaultRandom(),
  asistenciaId: uuid('asistencia_id')
    .notNull()
    .references(() => asistencia.id, { onDelete: 'cascade' }),
  apoderadoId: uuid('apoderado_id')
    .notNull()
    .references(() => apoderados.id),
  motivo: text('motivo').notNull(),
  archivoUrl: text('archivo_url'),
  estado: estadoJustificacionEnum('estado').default('pendiente').notNull(),
  revisadoEn: timestamp('revisado_en', { withTimezone: true }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});
