-- Execute only on the selected TEST database after a verified backup.
-- No USE statement: confirm SELECT DATABASE() before execution.
CREATE TABLE IF NOT EXISTS po_project_requests_shared (
 id VARCHAR(100) NOT NULL PRIMARY KEY,
 status VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
 revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
 created_by BIGINT UNSIGNED NOT NULL,
 decided_by BIGINT UNSIGNED NULL,
 project_id VARCHAR(100) NULL UNIQUE,
 payload LONGTEXT NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX idx_request_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS po_project_control_versions (
 workspace_revision BIGINT UNSIGNED NOT NULL PRIMARY KEY,
 actor_id BIGINT UNSIGNED NOT NULL,
 payload LONGTEXT NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
