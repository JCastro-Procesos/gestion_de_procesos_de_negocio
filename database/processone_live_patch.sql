-- Ejecutar una vez en u378754586_processone, después del esquema original.
CREATE TABLE IF NOT EXISTS po_workspace (
 id VARCHAR(40) NOT NULL PRIMARY KEY,
 payload LONGTEXT NOT NULL,
 revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
 updated_by BIGINT UNSIGNED NULL,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_po_workspace_editor FOREIGN KEY(updated_by) REFERENCES po_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- Almacena un único espacio de trabajo compartido. La revisión evita sobrescrituras silenciosas.
