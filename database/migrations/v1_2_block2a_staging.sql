-- ProcessOne v1.2 / Bloque 2A: SOLO STAGING. No ejecutar en producción.
-- Migración aditiva. No altera po_initiatives, po_projects ni po_initiative_projects.
-- Requiere Bloque 1 (po_cells_v12) y po_users existentes.
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
 -- Parent hierarchy and self-reference are validated by initiative_details_v12.php.
 INDEX idx_i2a_parent (parent_initiative_id),
 INDEX idx_i2a_cell (cell_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Verificación posterior (solo lectura):
-- SELECT TABLE_NAME FROM information_schema.TABLES
-- WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='po_initiative_details_v12';
