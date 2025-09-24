
# 🏗 Compensation & Benefits Module (Standalone)

## 1. Database (Minimal)

```sql
CREATE TABLE comp_benefit_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  benefit_type ENUM(
    'TERMINAL_LEAVE',
    'MONETIZATION',
    'PBB',
    'MID_YEAR_BONUS',
    'YEAR_END_BONUS',
    'EC',
    'GSIS',
    'LOYALTY'
  ) NOT NULL,
  days_used DECIMAL(6,2) DEFAULT NULL,   -- for TLB/Monetization
  amount DECIMAL(12,2) NOT NULL,
  notes VARCHAR(255) DEFAULT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);
```

This table acts as the **history log** of all processed benefits.

---

## 2. Benefit Rules

* **Terminal Leave (TLB)**
  `unused_leave × highest_salary × TLB_FACTOR`
  (Unused leave from `employee_leave_balances`, salary from `employees`.)

* **Monetization**
  `days × (monthly_salary ÷ DEFAULT_WORKING_DAYS)`
  (`days ≤ current_balance`, update `employee_leave_balances`.)

* **PBB**
  `monthly_salary × 12 × PBB_PERCENT`

* **13th Month (Mid-Year)**
  `monthly_salary`

* **14th Month (Year-End)**
  `monthly_salary`

* **Employee Compensation (EC)**
  Manual input by Admin.

* **GSIS %**
  `monthly_salary × GSIS_PERCENT`

* **Loyalty Award**
  `10,000 at 10 years + 5,000 for every +5 years`

---

## 3. Admin Workflows

### 🔹 Bulk (Yearly Benefits: PBB, 13th, 14th, Loyalty, GSIS)

1. Admin selects **Benefit Type**.
2. System fetches all active employees.
3. System computes amount per formula.
4. Show grid:
   \| Employee | Salary | Computed Amount | Notes | \[✔] Include |
5. Admin reviews, edits if needed, deselects some.
6. Click **Process All** → system inserts into `comp_benefit_records`.

---

### 🔹 Bulk Monetization

1. Admin selects **Monetization**.
2. System fetches employees + leave balances.
3. Admin enters `days_to_monetize` in grid.
4. System validates `days ≤ current_balance`.
5. Computes `days × daily_rate`.
6. On **Process All** →

   * Insert into `comp_benefit_records`.
   * Update `employee_leave_balances` (reduce balance).

---

### 🔹 Single Employee (Terminal Leave, EC)

* Admin selects **employee + benefit**.
* System computes (TLB) or admin inputs (EC).
* Insert into `comp_benefit_records`.

---

## 4. Reports

* **Benefit History per Employee**
  Show all rows from `comp_benefit_records` filtered by employee.

* **Annual Summary per Benefit Type**
  Example: PBB 2025 → total cost, number of employees.

* **Leave Monetization Register**
  Track days used and balances deducted.

* **Loyalty Awards List**
  Employees who reached milestones this year.

---

## 5. Admin UI (Simple)

* **Dashboard** → list of benefits (Terminal Leave, Monetization, PBB, 13th, 14th, EC, GSIS, Loyalty).
* **Bulk Compute Page** → grid with auto-calculated amounts + checkboxes.
* **Single Compute Page** → for TLB and EC.
* **History Page** → shows processed benefits, filterable by employee or benefit type.

---

## 6. Roadmap (Implementation Order)

1. Add `comp_benefit_records` table.
2. Build **Single Employee Processing** (TLB, EC).
3. Build **Bulk Processing** (PBB, 13th, 14th, Loyalty, GSIS, Monetization).
4. Add **Validation for Monetization** (check leave balances).
5. Add **Reports** (employee history, annual totals).
6. Add **Export** (CSV/PDF).

---

✅ This keeps everything **standalone**:

* No payroll integration.
* Just benefit computation + history.
* Admin-driven, with bulk actions for yearly benefits.

--