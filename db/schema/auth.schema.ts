import { pgTable, pgEnum, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const rolEnum = pgEnum('rol', ['admin', 'docente', 'padre', 'estudiante']);

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  rol: rolEnum('rol').notNull(),
  nombre: text('nombre').notNull(),
  apellido: text('apellido').notNull(),
  activo: boolean('activo').default(true).notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow().notNull(),
});

export const sesiones = pgTable('sesiones', {
  id: uuid('id').primaryKey().defaultRandom(),
  usuarioId: uuid('usuario_id')
    .notNull()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
});
