
# Payroll Workflow — 

## 1 — Create Payroll Period

* Admin → Payroll → **Create Period**
  Provide: `year`, `month`, `period_number` (1 or 2), `start_date`, `end_date`, `pay_date`.
* System validates dates and uniqueness.
* Period saved with `status = Draft`.

---

## 2 — Manage Allowances and Deductions

* Admin sets up allowance and deduction types (monthly, annual, conditional, etc.).
* Employee-specific overrides can also be added (custom amount, effective date).
* These become the base rules for payroll processing.

---

## 3 — Add Employees to Payroll Period

* Admin opens the payroll period and clicks **Process Payroll**.
* A list of active employees appears. Admin selects one, many, or all.
* For each employee, Admin enters **Working Days** (number for the current period).
* Default working days can be pre-filled from settings (e.g., 22) and adjusted per employee.

---

## 4 — System Processing (Per Employee)

When Admin submits:

1. Validate period is in `Draft` or `Processing`.
2. Fetch employee’s **daily\_rate** or compute from monthly salary.
3. Compute `basic_pay = daily_rate × working_days` (from manual input).
4. Pull applicable allowances and deductions:

   * Apply employee overrides if present.
   * Apply prorating rules if flagged.
   * Apply annual/conditional rules if matched.
5. Build payroll lines (`allowances`, `deductions`, `adjustments`).
6. Compute totals:

   * `total_allowances`
   * `total_deductions`
   * `net_pay = basic_pay + total_allowances − total_deductions`
7. Save/update `payroll_items` (per employee per period).
8. Save `payroll_item_lines` (each allowance/deduction/adjustment).
9. Log the processing action with Admin ID and timestamp.

---

## 5 — Review & Adjustments

* Admin reviews the payroll register (grid view).
* For each employee item:

  * Change working days and reprocess.
  * Edit allowance/deduction amounts.
  * Add one-time adjustments.
* System recalculates totals and updates records.
* Audit log captures changes.

---

## 6 — Finalization

* Once reviewed, Admin clicks **Finalize Period**.
* System checks all items are in `Draft`/`Processed`.
* Period status changes to `Completed`.
* `payroll_items` are locked from further edits.
* Audit log records who finalized and when.

---

## 7 — Payment

* On or after pay date, Admin/Finance marks items as **Paid**:

  * Either per employee or bulk.
* System sets `status = Paid`, records `paid_by`, `paid_at`.
* Payslip is generated (PDF) for each employee.
* Employees can view their payslips.

---

## 8 — Reopen (if needed)

* Admin can **Reopen Period** (requires reason).
* Status returns to `Processing`, payroll items become editable again.
* Changes logged in audit trail.
* After corrections, Admin re-finalizes.

---

## 9 — Audit & Logs

* All actions (create, edit, process, finalize, reopen, pay) are logged with:

  * User ID
  * Action
  * Timestamp
  * Before/after values (for edits)

