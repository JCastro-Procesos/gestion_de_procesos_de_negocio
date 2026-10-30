-- STAGING ONLY: project assignments are additive and do not alter workspace.
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
