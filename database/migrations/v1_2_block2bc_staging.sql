-- Bloque 2B + 2C. EJECUTAR SOLO EN BASE DE PRUEBAS, previa copia de seguridad.
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
