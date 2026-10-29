-- Invitación con contraseña temporal: obliga a cambiarla en el primer acceso.
-- Solo agrega columnas; no modifica datos existentes. Ejecutar tras respaldo.
ALTER TABLE po_users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE po_users ADD COLUMN temp_password_expires_at DATETIME NULL;
