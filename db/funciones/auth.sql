-- ============================================================
-- Ejecutar este archivo en el SQL Editor de Supabase
-- ============================================================

-- Habilitar pgcrypto (vive en el schema extensions en Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- FUNCIÓN: iniciar_sesion
-- ============================================================
CREATE OR REPLACE FUNCTION iniciar_sesion(p_email TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_usuario usuarios%ROWTYPE;
  v_token   TEXT;
  v_expira  TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_usuario
  FROM usuarios
  WHERE email = p_email AND activo = true;

  IF v_usuario.id IS NULL THEN
    RETURN json_build_object('error', 'Credenciales incorrectas');
  END IF;

  IF v_usuario.password_hash != crypt(p_password, v_usuario.password_hash) THEN
    RETURN json_build_object('error', 'Credenciales incorrectas');
  END IF;

  v_token  := encode(gen_random_bytes(32), 'hex');
  v_expira := NOW() + INTERVAL '8 hours';

  INSERT INTO sesiones (usuario_id, token, expires_at)
  VALUES (v_usuario.id, v_token, v_expira);

  RETURN json_build_object(
    'usuario', json_build_object(
      'id',       v_usuario.id,
      'email',    v_usuario.email,
      'rol',      v_usuario.rol,
      'nombre',   v_usuario.nombre,
      'apellido', v_usuario.apellido,
      'activo',   v_usuario.activo
    ),
    'token',     v_token,
    'expiresAt', v_expira
  );
END;
$$;

-- ============================================================
-- FUNCIÓN: cerrar_sesion
-- ============================================================
CREATE OR REPLACE FUNCTION cerrar_sesion(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  DELETE FROM sesiones WHERE token = p_token;
END;
$$;

-- ============================================================
-- FUNCIÓN: registrar_usuario
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_usuario(
  p_email    TEXT,
  p_password TEXT,
  p_rol      TEXT,
  p_nombre   TEXT,
  p_apellido TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM usuarios WHERE email = p_email) THEN
    RETURN json_build_object('error', 'El correo ya está registrado');
  END IF;

  INSERT INTO usuarios (email, password_hash, rol, nombre, apellido)
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf', 10)),
    p_rol::rol,
    p_nombre,
    p_apellido
  )
  RETURNING id INTO v_id;

  RETURN json_build_object(
    'id',       v_id,
    'email',    p_email,
    'rol',      p_rol,
    'nombre',   p_nombre,
    'apellido', p_apellido
  );
END;
$$;

-- ============================================================
-- PERMISOS
-- ============================================================
GRANT EXECUTE ON FUNCTION iniciar_sesion(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION cerrar_sesion(TEXT)         TO anon;
