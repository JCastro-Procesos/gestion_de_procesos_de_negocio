-- ProcessOne / Hostinger / MySQL 8+ o MariaDB 10.5+
-- Ejecutar SOLO en u378754586_processone. No contiene DROP ni altera otras bases.
-- No inserta usuarios ni contraseñas; el administrador inicial se crea por instalador PHP seguro.
SET NAMES utf8mb4;
CREATE TABLE IF NOT EXISTS po_users (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(190) NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 role ENUM('admin','direccion','gerencia','especialista','ingeniero') NOT NULL DEFAULT 'ingeniero',
 active TINYINT(1) NOT NULL DEFAULT 1,
 avatar_animal VARCHAR(32) NULL,
 avatar_path VARCHAR(255) NULL,
 last_login_at DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_po_users_email(email),
 KEY idx_po_users_active(active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS po_projects (
 id VARCHAR(100) NOT NULL PRIMARY KEY,
 name VARCHAR(190) NOT NULL,
 description TEXT NULL,
 status VARCHAR(40) NOT NULL DEFAULT 'Planeado',
 owner_id BIGINT UNSIGNED NULL,
 payload LONGTEXT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_po_projects_owner FOREIGN KEY(owner_id) REFERENCES po_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS po_initiatives (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(190) NOT NULL,
 objective TEXT NOT NULL,
 status ENUM('Planeada','En ejecución','Completada','En riesgo') NOT NULL DEFAULT 'Planeada',
 owner_id BIGINT UNSIGNED NULL,
 created_by BIGINT UNSIGNED NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_po_initiatives_owner FOREIGN KEY(owner_id) REFERENCES po_users(id) ON DELETE SET NULL,
 CONSTRAINT fk_po_initiatives_creator FOREIGN KEY(created_by) REFERENCES po_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS po_initiative_projects (
 initiative_id BIGINT UNSIGNED NOT NULL,
 project_id VARCHAR(100) NOT NULL,
 PRIMARY KEY(initiative_id,project_id),
 CONSTRAINT fk_po_links_initiative FOREIGN KEY(initiative_id) REFERENCES po_initiatives(id) ON DELETE CASCADE,
 CONSTRAINT fk_po_links_project FOREIGN KEY(project_id) REFERENCES po_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS po_tasks (
 id VARCHAR(100) NOT NULL PRIMARY KEY,
 project_id VARCHAR(100) NOT NULL,
 title VARCHAR(190) NOT NULL,
 status VARCHAR(40) NOT NULL DEFAULT 'Pendiente',
 assignee_id BIGINT UNSIGNED NULL,
 estimated_hours DECIMAL(9,2) NOT NULL DEFAULT 0,
 actual_hours DECIMAL(9,2) NOT NULL DEFAULT 0,
 payload LONGTEXT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_po_tasks_project FOREIGN KEY(project_id) REFERENCES po_projects(id) ON DELETE CASCADE,
 CONSTRAINT fk_po_tasks_assignee FOREIGN KEY(assignee_id) REFERENCES po_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS po_audit_log (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 actor_id BIGINT UNSIGNED NULL,
 action VARCHAR(80) NOT NULL,
 entity_type VARCHAR(80) NOT NULL,
 entity_id VARCHAR(100) NOT NULL,
 detail LONGTEXT NULL,
 ip_hash CHAR(64) NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_po_audit_created(created_at),
 CONSTRAINT fk_po_audit_actor FOREIGN KEY(actor_id) REFERENCES po_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS po_password_resets (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 token_hash CHAR(64) NOT NULL,
 expires_at DATETIME NOT NULL,
 used_at DATETIME NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_po_reset_token(token_hash),
 CONSTRAINT fk_po_reset_user FOREIGN KEY(user_id) REFERENCES po_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
