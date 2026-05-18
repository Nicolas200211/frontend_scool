-- ============================================================
-- Ejecutar en el SQL Editor de Supabase
-- Otorga acceso a la anon key para las tablas del sistema
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON grados      TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON secciones   TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON asignaturas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON horarios    TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON docentes    TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON estudiantes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON apoderados  TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON matriculas  TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON asistencia  TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON justificaciones TO anon;
