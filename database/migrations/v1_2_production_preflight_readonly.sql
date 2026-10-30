-- SOLO LECTURA. Ejecutar en la base de PRODUCCION seleccionada en hPanel.
SELECT DATABASE() AS base_actual, VERSION() AS version_motor;
SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('po_users','po_initiatives','po_cells_v12','po_initiative_details_v12','po_methodology_templates_v12','po_methodology_stages_v12','po_methodology_activities_v12','po_initiative_kpis_v12','po_initiative_kpi_measurements_v12','po_project_methodology_v12')
ORDER BY TABLE_NAME,ORDINAL_POSITION;
SELECT TABLE_NAME,CONSTRAINT_NAME,CONSTRAINT_TYPE FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('po_users','po_initiatives','po_cells_v12','po_initiative_details_v12','po_methodology_templates_v12','po_methodology_stages_v12','po_methodology_activities_v12','po_initiative_kpis_v12','po_initiative_kpi_measurements_v12','po_project_methodology_v12') ORDER BY TABLE_NAME,CONSTRAINT_NAME;
