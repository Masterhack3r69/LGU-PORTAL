

# Compensation & Benefits Workflow — Admin Side

### 1 — Define Benefit Types

* Admin goes to **Compensation & Benefits → Manage Types**.
* System has preloaded types:

  * Terminal Benefit Claims
  * Monetization of Leave Credits
  * Performance-Based Bonus (PBB)
  * Mid-Year Bonus (13th Month Pay)
  * Year-End Bonus (14th Month Pay)
  * Employee Compensation (EC)
  * GSIS Contributions/Claims
  * Loyalty Award Benefits
* Admin can:

  * Adjust formulas (fixed %, number of months, lump sum).
  * Add new benefit types if needed.
  * Mark them as recurring (annual) or one-time (event-driven).

---

### 2 — Create Benefit Cycle (Yearly or Special)

* Admin creates a **Benefit Cycle** (like a payroll period but annual/event-based).
* Example: `Year 2025 → Mid-Year Bonus`.
* Fields: `benefit_type_id`, `year`, `applicable_date`, `status (Draft/Processed/Released)`.
* This keeps benefits organized by year and type.

---

### 3 — Select Employees

* Admin chooses eligible employees.
* For **annual benefits** (e.g., 13th Month, 14th Month, Loyalty), system can **auto-fetch all active employees**.
* For **special benefits** (e.g., terminal benefits, monetization of leave credits), Admin manually selects employees.

---

### 4 — System Calculation

When Admin processes:

* System applies **rules/formula** defined per benefit type:

  * **13th Month (Mid-Year Bonus)** = average basic pay ÷ 12 × months worked.
  * **14th Month (Year-End Bonus)** = fixed formula defined by HR/Finance.
  * **PBB** = percentage of annual salary (or flat rate) per policy.
  * **Loyalty Award** = fixed amount for employees reaching milestones (10 yrs, 20 yrs, etc.).
  * **EC/GSIS** = claims or % contributions pulled from settings.
  * **Terminal Benefits** = based on employee separation/retirement details.
  * **Leave Monetization** = daily\_rate × number\_of\_days monetized.
* Each employee’s **benefit item** is saved with breakdown lines.

---

### 5 — Review & Adjustments

* Admin reviews the generated benefit register (like payroll register).
* Can edit:

  * Eligible employees
  * Amounts (overrides allowed)
  * Add one-time adjustments
* Changes logged in audit trail.

---

### 6 — Finalization & Release

* Admin finalizes the benefit cycle.
* Status changes from `Draft → Processed → Released`.
* Items are locked after release.
* Payslips/benefit slips are generated.

---

### 7 — Integration with Payroll

* Benefits can be:

  * **Standalone** (separate from regular payroll) → Employee receives separate slip/payment.
  * **Integrated with Payroll Period** → Benefit added as a payroll item line (`line_type = allowance/bonus`).
* Example: Mid-Year Bonus can either be in a June payroll period OR a separate benefit cycle.

---

### 8 — Reporting

* System provides reports by year, type, and employee:

  * Total 13th Month paid in 2025.
  * List of employees with loyalty awards.
  * GSIS/EC contribution summaries.

---

### Admin Flow Summary

1. **Setup Benefit Cycle** (select year & type).
2. **Select Employees** (auto or manual).
3. **System Calculates** based on formula/rules.
4. **Admin Reviews/Adjusts** amounts.
5. **Finalize & Release** → employees get slips.
6. **Report & Export** for accounting.

---

Keep **Compensation & Benefits** as a **separate module** (with its own cycles & slips).
