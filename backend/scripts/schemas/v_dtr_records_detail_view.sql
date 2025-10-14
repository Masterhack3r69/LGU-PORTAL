-- View structure for view `v_dtr_records_detail`

DROP VIEW IF EXISTS `v_dtr_records_detail`;

CREATE OR REPLACE VIEW `v_dtr_records_detail` AS
SELECT 
  dr.id,
  dr.payroll_period_id,
  pp.year,
  pp.month,
  pp.period_number,
  pp.start_date AS period_start_date,
  pp.end_date AS period_end_date,
  dr.employee_id,
  dr.employee_number,
  CONCAT(e.first_name, ' ', IFNULL(CONCAT(LEFT(e.middle_name, 1), '. '), ''), e.last_name) AS employee_name,
  e.plantilla_position,
  e.current_daily_rate,
  dr.start_date,
  dr.end_date,
  dr.working_days,
  (dr.working_days * e.current_daily_rate) AS calculated_basic_pay,
  dr.status,
  dr.notes,
  dr.import_batch_id,
  ib.file_name AS import_file_name,
  ib.imported_at AS import_date,
  u1.username AS imported_by_username,
  dr.updated_by,
  u2.username AS updated_by_username,
  dr.updated_at
FROM dtr_records dr
JOIN payroll_periods pp ON dr.payroll_period_id = pp.id
JOIN employees e ON dr.employee_id = e.id
JOIN dtr_import_batches ib ON dr.import_batch_id = ib.id
JOIN users u1 ON dr.imported_by = u1.id
LEFT JOIN users u2 ON dr.updated_by = u2.id
WHERE e.deleted_at IS NULL;
