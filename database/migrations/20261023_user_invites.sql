-- Seguridad: invitaciones y recuperaciones. Aplicar tras respaldo y aprobación.
-- No modificar datos existentes; las cuentas antiguas continúan funcionando.
CREATE TABLE IF NOT EXISTS po_auth_tokens (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 purpose ENUM('invite','reset') NOT NULL,
 token_hash CHAR(64) NOT NULL,
 expires_at DATETIME NOT NULL,
 consumed_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_po_auth_token(token_hash),
 KEY idx_po_auth_user(user_id,purpose),
 CONSTRAINT fk_po_auth_user FOREIGN KEY(user_id) REFERENCES po_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE po_users ADD COLUMN invitation_pending TINYINT(1) NOT NULL DEFAULT 0;
