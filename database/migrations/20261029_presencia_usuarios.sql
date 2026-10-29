-- Presencia de usuarios: última actividad y cierre de sesión. Solo agrega columnas.
-- Si last_login_at ya existe, el error "columna duplicada" (1060) se puede ignorar.
ALTER TABLE po_users ADD COLUMN last_login_at DATETIME NULL;
ALTER TABLE po_users ADD COLUMN last_seen_at DATETIME NULL;
ALTER TABLE po_users ADD COLUMN last_logout_at DATETIME NULL;
