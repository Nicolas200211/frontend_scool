import { pgTable, uuid, text, date, timestamp } from 'drizzle-orm/pg-core';
import { usuarios } from './auth.schema';

export const estudiantes = pgTable('estudiantes', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  codigo: text('codigo').notNull().unique(),
  fechaNacimiento: date('fecha_nacimiento'),
  direccion: text('direccion'),
  fotoUrl: text('foto_url'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow().notNull(),
});

export const docentes = pgTable('docentes', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  especialidad: text('especialidad'),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow().notNull(),
});

export const apoderados = pgTable('apoderados', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  estudianteId: uuid('estudiante_id')
    .notNull()
    .references(() => estudiantes.id, { onDelete: 'cascade' }),
  parentesco: text('parentesco').notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});
