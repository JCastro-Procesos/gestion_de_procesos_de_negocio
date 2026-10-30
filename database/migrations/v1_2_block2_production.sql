-- ProcessOne: pase Bloque 2 a produccion.
-- Requiere respaldo SQL descargado y verificado antes de ejecutar.
-- IDs de po_users, po_initiatives y po_cells_v12 verificados BIGINT UNSIGNED.
-- Crea 7 tablas nuevas; no carga datos de pruebas ni modifica tablas existentes.
-- DDL no es reversible mediante ROLLBACK. Si ocurre un error, detener y revisar.
USE `u378754586_processone`;

CREATE TABLE IF NOT EXISTS po_initiative_details_v12 (
 initiative_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
 code VARCHAR(32) NULL UNIQUE,
 initiative_level ENUM('Corporativa','Departamental') NOT NULL DEFAULT 'Departamental',
 parent_initiative_id BIGINT UNSIGNED NULL,
 department VARCHAR(120) NULL,
 problem_statement TEXT NULL,
 expected_benefit TEXT NULL,
 scope_text TEXT NULL,
 priority ENUM('Baja','Media','Alta','Crítica') NOT NULL DEFAULT 'Media',
 cell_id BIGINT UNSIGNED NULL,
 sponsor_user_id BIGINT UNSIGNED NULL,
 process_owner_user_id BIGINT UNSIGNED NULL,
 start_date DATE NULL,
 target_date DATE NULL,
 baseline_plan TEXT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_i2a_initiative FOREIGN KEY (initiative_id) REFERENCES po_initiatives(id) ON DELETE CASCADE,
 CONSTRAINT fk_i2a_parent FOREIGN KEY (parent_initiative_id) REFERENCES po_initiatives(id) ON DELETE SET NULL,
 CONSTRAINT fk_i2a_cell FOREIGN KEY (cell_id) REFERENCES po_cells_v12(id) ON DELETE SET NULL,
 CONSTRAINT fk_i2a_sponsor FOREIGN KEY (sponsor_user_id) REFERENCES po_users(id) ON DELETE SET NULL,
 CONSTRAINT fk_i2a_owner FOREIGN KEY (process_owner_user_id) REFERENCES po_users(id) ON DELETE SET NULL,
 CONSTRAINT ck_i2a_dates CHECK (target_date IS NULL OR start_date IS NULL OR target_date >= start_date),
 INDEX idx_i2a_parent (parent_initiative_id),
 INDEX idx_i2a_cell (cell_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS po_methodology_templates_v12 (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(32) NOT NULL, name VARCHAR(190) NOT NULL,
 version INT UNSIGNED NOT NULL DEFAULT 1,
 status ENUM('Borrador','Publicada','Archivada') NOT NULL DEFAULT 'Borrador',
 created_by BIGINT UNSIGNED NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_methodology_version (code,version),
 CONSTRAINT fk_method_creator FOREIGN KEY (created_by) REFERENCES po_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS po_methodology_stages_v12 (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 template_id BIGINT UNSIGNED NOT NULL,
 stage_order TINYINT UNSIGNED NOT NULL,
 title VARCHAR(190) NOT NULL,
 weight DECIMAL(5,2) NOT NULL DEFAULT 0,
 UNIQUE KEY uq_template_stage (template_id,stage_order),
 CONSTRAINT fk_method_stage FOREIGN KEY (template_id) REFERENCES po_methodology_templates_v12(id) ON DELETE CASCADE,
 CONSTRAINT ck_stage_order CHECK(stage_order BETWEEN 1 AND 6),
 CONSTRAINT ck_stage_weight CHECK(weight BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS po_methodology_activities_v12 (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 stage_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(190) NOT NULL,
 deliverable VARCHAR(500) NULL,
 acceptance_criteria TEXT NULL,
 suggested_role VARCHAR(100) NULL,
 estimated_days DECIMAL(7,2) NULL,
 required TINYINT(1) NOT NULL DEFAULT 1,
 CONSTRAINT fk_method_activity FOREIGN KEY (stage_id) REFERENCES po_methodology_stages_v12(id) ON DELETE CASCADE,
 CONSTRAINT ck_estimated_days CHECK (estimated_days IS NULL OR estimated_days>=0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS po_initiative_kpis_v12 (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 initiative_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(190) NOT NULL, unit VARCHAR(60) NOT NULL,
 direction ENUM('increase','decrease') NOT NULL DEFAULT 'increase',
 baseline DECIMAL(18,4) NOT NULL,
 target DECIMAL(18,4) NOT NULL,
 target_date DATE NULL, frequency VARCHAR(60) NOT NULL DEFAULT 'Mensual',
 data_source VARCHAR(500) NULL, owner_user_id BIGINT UNSIGNED NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_kpi_initiative FOREIGN KEY (initiative_id) REFERENCES po_initiatives(id) ON DELETE CASCADE,
 CONSTRAINT fk_kpi_owner FOREIGN KEY (owner_user_id) REFERENCES po_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS po_initiative_kpi_measurements_v12 (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 kpi_id BIGINT UNSIGNED NOT NULL, measured_at DATE NOT NULL,
 actual DECIMAL(18,4) NOT NULL,
 evidence_url VARCHAR(1000) NULL,
 recorded_by BIGINT UNSIGNED NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_kpi_measurement FOREIGN KEY (kpi_id) REFERENCES po_initiative_kpis_v12(id) ON DELETE CASCADE,
 CONSTRAINT fk_measurement_user FOREIGN KEY (recorded_by) REFERENCES po_users(id) ON DELETE SET NULL,
 INDEX idx_kpi_date(kpi_id,measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_project_methodology_v12 (
 project_id VARCHAR(100) NOT NULL PRIMARY KEY,
 template_id BIGINT UNSIGNED NOT NULL,
 initiative_id BIGINT UNSIGNED NOT NULL,
 assigned_by BIGINT UNSIGNED NULL,
 assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_pm_template FOREIGN KEY (template_id) REFERENCES po_methodology_templates_v12(id) ON DELETE RESTRICT,
 CONSTRAINT fk_pm_initiative FOREIGN KEY (initiative_id) REFERENCES po_initiatives(id) ON DELETE RESTRICT,
 CONSTRAINT fk_pm_user FOREIGN KEY (assigned_by) REFERENCES po_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Resultado esperado: siete filas, todas con ENGINE InnoDB.
SELECT TABLE_NAME,ENGINE FROM information_schema.TABLES
WHERE TABLE_SCHEMA='u378754586_processone' AND TABLE_NAME IN ('po_initiative_details_v12','po_methodology_templates_v12','po_methodology_stages_v12','po_methodology_activities_v12','po_initiative_kpis_v12','po_initiative_kpi_measurements_v12','po_project_methodology_v12') ORDER BY TABLE_NAME;
