-- ProcessOne: Gobierno y colaboración. PRODUCCION.
-- Ejecutar solo después de exportar y comprobar el respaldo de producción.
-- Mismas dos tablas validadas en pruebas; no copia datos de pruebas.
-- DDL no se revierte con ROLLBACK.
USE `u378754586_processone`;
-- Requiere las tablas de Gobierno existentes y un respaldo previo.
-- Aditiva e idempotente: no cambia solicitudes, estados ni decisiones anteriores.
CREATE TABLE IF NOT EXISTS po_governance_details (
 item_id CHAR(36) NOT NULL PRIMARY KEY,
 owner_user_id BIGINT UNSIGNED NULL,
 approver_user_id BIGINT UNSIGNED NULL,
 due_date DATE NULL,
 evidence_url VARCHAR(1000) NOT NULL DEFAULT '',
 impact_summary TEXT NULL,
 implementation_status ENUM('Pendiente','En curso','Implementado','Verificado') NOT NULL DEFAULT 'Pendiente',
 implementation_note TEXT NULL,
 revision INT UNSIGNED NOT NULL DEFAULT 0,
 CONSTRAINT fk_gov_details_item FOREIGN KEY(item_id) REFERENCES po_governance_items(id),
 CONSTRAINT fk_gov_details_owner FOREIGN KEY(owner_user_id) REFERENCES po_users(id),
 CONSTRAINT fk_gov_details_approver FOREIGN KEY(approver_user_id) REFERENCES po_users(id),
 KEY idx_gov_due(due_date),
 KEY idx_gov_owner(owner_user_id),
 KEY idx_gov_approver(approver_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SHOW COLUMNS FROM po_governance_details;
-- Versiones de la ficha para consultar el contenido anterior de cada evento.
CREATE TABLE IF NOT EXISTS po_governance_versions (
 item_id CHAR(36) NOT NULL,
 revision INT UNSIGNED NOT NULL,
 event_id BIGINT UNSIGNED NOT NULL,
 snapshot MEDIUMTEXT NOT NULL,
 PRIMARY KEY(item_id,revision),
 UNIQUE KEY uq_gov_version_event(event_id),
 CONSTRAINT fk_gov_version_item FOREIGN KEY(item_id) REFERENCES po_governance_items(id),
 CONSTRAINT fk_gov_version_event FOREIGN KEY(event_id) REFERENCES po_governance_events(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SHOW COLUMNS FROM po_governance_versions;
