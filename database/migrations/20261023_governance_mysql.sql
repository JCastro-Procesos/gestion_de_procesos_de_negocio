-- Fase 1 / DAT-01: registros de Gobierno en MySQL.
-- Aplicar SOLO tras respaldo y autorización, en la base exclusiva de ProcessOne.
-- Migración aditiva, sin DROP ni cambios a registros existentes.
CREATE TABLE IF NOT EXISTS po_governance_items (
 id CHAR(36) NOT NULL PRIMARY KEY,
 kind ENUM('Solicitud','Entregable','Cambio') NOT NULL,
 project_id VARCHAR(100) NULL,
 title VARCHAR(190) NOT NULL,
 description TEXT NOT NULL,
 severity ENUM('Menor','Mayor','Crítico') NOT NULL DEFAULT 'Menor',
 status ENUM('Pendiente','Aprobado','Rechazado','Devuelto') NOT NULL DEFAULT 'Pendiente',
 owner VARCHAR(100) NOT NULL DEFAULT '',
 reviewer_id BIGINT UNSIGNED NULL,
 comment TEXT NOT NULL,
 created_by BIGINT UNSIGNED NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_governance_status(status),
 KEY idx_governance_project(project_id),
 CONSTRAINT fk_governance_creator FOREIGN KEY(created_by) REFERENCES po_users(id),
 CONSTRAINT fk_governance_reviewer FOREIGN KEY(reviewer_id) REFERENCES po_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS po_governance_events (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 item_id CHAR(36) NOT NULL,
 actor_id BIGINT UNSIGNED NOT NULL,
 action VARCHAR(50) NOT NULL,
 previous_status VARCHAR(40) NULL,
 next_status VARCHAR(40) NULL,
 note TEXT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_governance_event_item(item_id,created_at),
 CONSTRAINT fk_governance_event_item FOREIGN KEY(item_id) REFERENCES po_governance_items(id),
 CONSTRAINT fk_governance_event_actor FOREIGN KEY(actor_id) REFERENCES po_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
