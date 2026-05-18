-- ============================================================
-- Ejecutar DESPUÉS de auth.sql
-- Crea el primer usuario administrador del sistema
-- Cambiar email y contraseña antes de ejecutar
-- ============================================================
SELECT registrar_usuario(
  'admin@colegio.edu',
  'Admin123!',
  'admin',
  'Administrador',
  'Sistema'
);
