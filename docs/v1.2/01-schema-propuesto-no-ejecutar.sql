-- ProcessOne v1.2 / Bloque 1 — PROPUESTA NO EJECUTADA.
-- REVISIÓN OBLIGATORIA: comparar con SHOW CREATE TABLE de la BD real y migraciones vigentes.
-- No usar directamente en producción. Diseñado como tablas aditivas para MySQL 8.
-- Identificadores de proyecto y usuario: confirmar tipos reales antes de crear claves foráneas.
-- Ninguna tabla existente se altera, borra o renombra aquí.
CREATE TABLE IF NOT EXISTS po_cells_v12 (
 id VARCHAR(64) PRIMARY KEY,
 code VARCHAR(32) NOT NULL UNIQUE,
 name VARCHAR(190) NOT NULL,
 mission TEXT NOT NULL,
 leader_user_id VARCHAR(64) NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'Borrador',
 capacity_hours_week DECIMAL(8,2) NULL,
 created_at DATETIME NOT NULL,
 updated_at DATETIME NOT NULL,
 CHECK (capacity_hours_week IS NULL OR capacity_hours_week >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_cell_members_v12 (
 cell_id VARCHAR(64) NOT NULL,
 user_id VARCHAR(64) NOT NULL,
 role VARCHAR(24) NOT NULL,
 allocated_hours_week DECIMAL(8,2) NULL,
 effective_from DATE NOT NULL,
 effective_to DATE NULL,
 PRIMARY KEY (cell_id,user_id,effective_from),
 FOREIGN KEY (cell_id) REFERENCES po_cells_v12(id),
 CHECK (allocated_hours_week IS NULL OR allocated_hours_week >= 0),
 CHECK (effective_to IS NULL OR effective_to >= effective_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_initiatives_v12 (
 id VARCHAR(64) PRIMARY KEY,
 code VARCHAR(32) NOT NULL UNIQUE,
 title VARCHAR(190) NOT NULL,
 objective TEXT NOT NULL,
 problem_statement TEXT NOT NULL,
 cell_id VARCHAR(64) NULL,
 sponsor_user_id VARCHAR(64) NULL,
 owner_user_id VARCHAR(64) NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'Borrador',
 start_date DATE NULL,
 target_date DATE NULL,
 baseline_plan TEXT NULL,
 created_at DATETIME NOT NULL,
 updated_at DATETIME NOT NULL,
 FOREIGN KEY (cell_id) REFERENCES po_cells_v12(id),
 CHECK (target_date IS NULL OR start_date IS NULL OR target_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_project_initiatives_v12 (
 project_id VARCHAR(80) NOT NULL,
 initiative_id VARCHAR(64) NOT NULL,
 link_role ENUM('Principal','Secundaria') NOT NULL,
 contribution_description TEXT NULL,
 -- Sólo una iniciativa principal por proyecto; varias secundarias permitidas.
 primary_project_id VARCHAR(80) GENERATED ALWAYS AS (CASE WHEN link_role='Principal' THEN project_id ELSE NULL END) STORED,
 PRIMARY KEY (project_id,initiative_id),
 UNIQUE KEY uq_primary_initiative_per_project (primary_project_id),
 FOREIGN KEY (initiative_id) REFERENCES po_initiatives_v12(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_methodology_versions_v12 (
 id VARCHAR(64) PRIMARY KEY,
 methodology_id INT NOT NULL,
 version INT NOT NULL,
 status ENUM('Borrador','Publicada','Archivada') NOT NULL,
 stage_count TINYINT NOT NULL DEFAULT 6,
 published_at DATETIME NULL,
 UNIQUE KEY uq_methodology_version (methodology_id,version),
 CHECK (stage_count = 6),
 CHECK (version > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_activity_templates_v12 (
 id VARCHAR(64) PRIMARY KEY,
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
 CHECK (estimated_working_days IS NULL OR estimated_working_days >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_project_governance_v12 (
 project_id VARCHAR(80) PRIMARY KEY,
 cell_id VARCHAR(64) NULL,
 process_owner_user_id VARCHAR(64) NULL,
 project_manager_user_id VARCHAR(64) NULL,
 methodology_version_id VARCHAR(64) NULL,
 regularization_status ENUM('Pendiente','Completa') NOT NULL DEFAULT 'Pendiente',
 FOREIGN KEY (cell_id) REFERENCES po_cells_v12(id),
 FOREIGN KEY (methodology_version_id) REFERENCES po_methodology_versions_v12(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_activity_origins_v12 (
 project_id VARCHAR(80) NOT NULL,
 activity_id VARCHAR(80) NOT NULL,
 template_id VARCHAR(64) NOT NULL,
 template_version INT NOT NULL,
 origin ENUM('Metodología','Iniciativa','Gobierno') NOT NULL,
 PRIMARY KEY (project_id,activity_id,template_id,template_version),
 FOREIGN KEY (template_id) REFERENCES po_activity_templates_v12(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_initiative_kpis_v12 (
 id VARCHAR(64) PRIMARY KEY,
 initiative_id VARCHAR(64) NOT NULL,
 name VARCHAR(190) NOT NULL,
 unit VARCHAR(64) NOT NULL,
 direction ENUM('increase','decrease') NOT NULL,
 baseline DECIMAL(18,4) NULL,
 target DECIMAL(18,4) NULL,
 target_date DATE NULL,
 data_source VARCHAR(255) NOT NULL,
 owner_user_id VARCHAR(64) NULL,
 FOREIGN KEY (initiative_id) REFERENCES po_initiatives_v12(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_kpi_measurements_v12 (
 id VARCHAR(64) PRIMARY KEY,
 kpi_id VARCHAR(64) NOT NULL,
 measured_at DATETIME NOT NULL,
 actual DECIMAL(18,4) NOT NULL,
 evidence_url TEXT NULL,
 FOREIGN KEY (kpi_id) REFERENCES po_initiative_kpis_v12(id),
 INDEX idx_kpi_date (kpi_id,measured_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
