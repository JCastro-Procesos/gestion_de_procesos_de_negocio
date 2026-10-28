-- ProcessOne v1.2 Bloque 1 — migración aditiva para STAGING, NO desplegar automáticamente.
-- Revisado contra server/api/index.php y database/processone_live_patch.sql.
-- Las iniciativas originales (po_initiatives BIGINT) y po_workspace se conservan.
-- PRECONDICIONES: MySQL 8, respaldos, SHOW CREATE TABLE, usuario con permisos DDL.
CREATE TABLE IF NOT EXISTS po_cells_v12 (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(32) NOT NULL UNIQUE,
 name VARCHAR(190) NOT NULL,
 mission TEXT NOT NULL,
 leader_user_id BIGINT UNSIGNED NULL,
 status ENUM('Borrador','Activa','Pausada','Archivada') NOT NULL DEFAULT 'Borrador',
 capacity_hours_week DECIMAL(8,2) NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_cell_leader_v12 FOREIGN KEY (leader_user_id) REFERENCES po_users(id) ON DELETE SET NULL,
 CHECK (capacity_hours_week IS NULL OR capacity_hours_week >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_cell_members_v12 (
 cell_id BIGINT UNSIGNED NOT NULL,
 user_id BIGINT UNSIGNED NOT NULL,
 role ENUM('Líder','Integrante') NOT NULL,
 allocated_hours_week DECIMAL(8,2) NULL,
 effective_from DATE NOT NULL,
 effective_to DATE NULL,
 PRIMARY KEY (cell_id,user_id,effective_from),
 FOREIGN KEY (cell_id) REFERENCES po_cells_v12(id),
 FOREIGN KEY (user_id) REFERENCES po_users(id),
 CHECK (allocated_hours_week IS NULL OR allocated_hours_week >= 0),
 CHECK (effective_to IS NULL OR effective_to >= effective_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Extiende iniciativas originales sin copiar ni perder sus proyectos asociados.
CREATE TABLE IF NOT EXISTS po_initiative_details_v12 (
 initiative_id BIGINT UNSIGNED PRIMARY KEY,
 code VARCHAR(32) NULL UNIQUE,
 problem_statement TEXT NULL,
 cell_id BIGINT UNSIGNED NULL,
 sponsor_user_id BIGINT UNSIGNED NULL,
 process_owner_user_id BIGINT UNSIGNED NULL,
 start_date DATE NULL,
 target_date DATE NULL,
 baseline_plan TEXT NULL,
 FOREIGN KEY (initiative_id) REFERENCES po_initiatives(id) ON DELETE CASCADE,
 FOREIGN KEY (cell_id) REFERENCES po_cells_v12(id) ON DELETE SET NULL,
 FOREIGN KEY (sponsor_user_id) REFERENCES po_users(id) ON DELETE SET NULL,
 FOREIGN KEY (process_owner_user_id) REFERENCES po_users(id) ON DELETE SET NULL,
 CHECK (target_date IS NULL OR start_date IS NULL OR target_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rol principal se almacena por separado: una sola iniciativa principal por proyecto.
-- Las relaciones secundarias actuales se conservan en po_initiative_projects.
CREATE TABLE IF NOT EXISTS po_project_governance_v12 (
 project_id VARCHAR(100) PRIMARY KEY,
 primary_initiative_id BIGINT UNSIGNED NULL,
 cell_id BIGINT UNSIGNED NULL,
 process_owner_user_id BIGINT UNSIGNED NULL,
 project_manager_user_id BIGINT UNSIGNED NULL,
 methodology_version_id BIGINT UNSIGNED NULL,
 regularization_status ENUM('Pendiente','Completa') NOT NULL DEFAULT 'Pendiente',
 FOREIGN KEY (project_id) REFERENCES po_projects(id) ON DELETE CASCADE,\n FOREIGN KEY (primary_initiative_id) REFERENCES po_initiatives(id) ON DELETE SET NULL,
 FOREIGN KEY (cell_id) REFERENCES po_cells_v12(id) ON DELETE SET NULL,
 FOREIGN KEY (process_owner_user_id) REFERENCES po_users(id) ON DELETE SET NULL,
 FOREIGN KEY (project_manager_user_id) REFERENCES po_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_methodology_versions_v12 (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 methodology_id INT NOT NULL,
 version INT NOT NULL,
 status ENUM('Borrador','Publicada','Archivada') NOT NULL,
 stage_count TINYINT NOT NULL DEFAULT 6,
 published_at DATETIME NULL,
 UNIQUE KEY uq_methodology_version (methodology_id,version),
 CHECK (stage_count=6 AND version>0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_activity_templates_v12 (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 origin ENUM('Metodología','Iniciativa','Gobierno') NOT NULL,
 source_id VARCHAR(64) NOT NULL,
 version INT NOT NULL,
 canonical_key VARCHAR(120) NOT NULL,
 stage_order TINYINT NOT NULL,
 title VARCHAR(190) NOT NULL,
 deliverable TEXT NULL,
 estimated_working_days INT NULL,
 suggested_role VARCHAR(64) NULL,
 required_flag TINYINT(1) NOT NULL DEFAULT 1,
 UNIQUE KEY uq_source_template (origin,source_id,version,canonical_key),
 CHECK (stage_order BETWEEN 1 AND 6),
 CHECK (estimated_working_days IS NULL OR estimated_working_days>=0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_activity_origins_v12 (
 project_id VARCHAR(100) NOT NULL,
 activity_id VARCHAR(100) NOT NULL,
 template_id BIGINT UNSIGNED NOT NULL,
 template_version INT NOT NULL,
 origin ENUM('Metodología','Iniciativa','Gobierno') NOT NULL,
 PRIMARY KEY (project_id,activity_id,template_id,template_version),
 FOREIGN KEY (template_id) REFERENCES po_activity_templates_v12(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_initiative_kpis_v12 (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 initiative_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(190) NOT NULL,
 unit VARCHAR(64) NOT NULL,
 direction ENUM('increase','decrease') NOT NULL,
 baseline DECIMAL(18,4) NULL,
 target DECIMAL(18,4) NULL,
 target_date DATE NULL,
 data_source VARCHAR(255) NOT NULL,
 owner_user_id BIGINT UNSIGNED NULL,
 FOREIGN KEY (initiative_id) REFERENCES po_initiatives(id) ON DELETE CASCADE,
 FOREIGN KEY (owner_user_id) REFERENCES po_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_kpi_measurements_v12 (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 kpi_id BIGINT UNSIGNED NOT NULL,
 measured_at DATETIME NOT NULL,
 actual DECIMAL(18,4) NOT NULL,
 evidence_url TEXT NULL,
 FOREIGN KEY (kpi_id) REFERENCES po_initiative_kpis_v12(id) ON DELETE CASCADE,
 INDEX idx_kpi_date (kpi_id,measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- No se aplica FK methodology_version_id hasta verificar el orden de migración.\n-- La FK project_id usa po_projects.id VARCHAR(100); revisar proyectos sólo presentes en workspace JSON.
