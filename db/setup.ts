import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const sql = postgres(process.env['DATABASE_URL']!);

async function setup(): Promise<void> {
  const authSql = readFileSync(join(__dirname, 'funciones/auth.sql'), 'utf-8');
  const permisosSql = readFileSync(join(__dirname, 'permisos/tablas.sql'), 'utf-8');
  await sql.unsafe(authSql);
  await sql.unsafe(permisosSql);
  await sql.end();
  console.log('Setup completado.');
}

setup().catch((err) => { console.error(err); process.exit(1); });
