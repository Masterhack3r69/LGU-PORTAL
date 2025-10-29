
### **Phase 1: Input Data Gathering & Triggers**

* **When:** This happens *before* the payroll calculation period begins, usually right after the previous pay period ends or during the first few days of the current pay period. Deadlines for submission are crucial (implied by the `REMINDERS` file).
* **How:** Manual collection of physical or digital documents.
    * **DTRs:** Submitted by employees/departments, verified by supervisors/HR. Used for attendance verification.
    * **Session Minutes (SB):** Official record from the Sangguniang Bayan Secretary.
    * **MSWD Report:** Submitted by the MSWD office, likely detailing fieldwork days.
    * **Billings:** Received electronically or physically from GSIS, Pag-IBIG, Banks, SJMO. These are critical as loan balances and required payments can change.

### **Phase 2: Calculation of Gross Pay, Deductions, and Net Pay**

* **When:** This is the core processing phase, typically occurring mid-month or leading up to the pay date (e.g., if payday is the 30th, processing might happen from the 10th to the 20th). Newly hired payrolls might run slightly off-cycle depending on hiring dates.
* **How (Formulas & Logic):** This heavily relies on spreadsheet formulas within the original `payroll.xlsx` (which we see exported as CSVs).

    **Stream A & B: Salaries (Regular & Newly Hired - `payroll*.csv`)**
    * `Gross Compensation (TOTAL)` = `Basic Salary` + `PERA`
        * *Note:* `Basic Salary` itself might be adjusted *before* this calculation if the DTR indicated leave without pay (LWOP). The formula would be `(Monthly Basic / Working Days in Month) * Days Present`. PERA is usually fixed (Php 2000/month) unless the employee worked less than the full period.
    * `Mandatory Deductions`:
        * `Withholding tax (BIR.csv)`: This uses the BIR's graduated tax table formula based on taxable income.
            * *Taxable Income* = `Gross Compensation` - Non-Taxable Deductions (`GSIS Life/Retirement PS`, `PAG-IBIG Premiums PS`, `PhilHEALTH Premiums PS`, sometimes Union Dues). The exact formula involves brackets, percentages, and fixed amounts as per tax regulations. The `BIR.csv` shows the *result* of this complex calculation.
        * `GSIS Life/ Retirement Insurance Premium (P.S.)`: = `Basic Salary` * 9% (This is the standard employee share rate).
        * `GSIS State Insurance (G.S. - EC Fund)`: This is usually paid entirely by the employer (Government Share - GS), but sometimes listed. The amount is typically fixed based on salary bracket (often Php 100 or slightly more). The `GSIS.csv` file shows `PS` (Personal Share = 9%), `GS` (Government Share = 12%), and `EC` (Employee Compensation = Php 100/30 fixed).
        * `PAG-IBIG Premiums (P.S.)`: = Usually Php 100 fixed if salary is above Php 5,000. It can be 2% of basic salary for higher earners if they opt-in, but Php 100 is standard. `PAGIBIG premiums.csv` shows `EE Share` (Employee) and `ER Share` (Employer), both often Php 100.
        * `PhilHEALTH Premiums (P.S.)`: Calculated based on the PhilHealth contribution table. It's a percentage of `Basic Salary` (e.g., 4% in 2023, shared 50/50 between employee and employer), with salary floors and ceilings. Formula: `Basic Salary` * Rate (e.g., 4%) / 2.
    * `Other Deductions (Loans, etc.)`: These amounts are *not typically calculated* by formula within the payroll sheet itself. They are **transcribed directly** from the official billings received in Phase 1 (GSIS Loan Billing, Pag-IBIG Billing, Bank Statements, SJMO Statement). The payroll sheet acts as a collation tool for these externally determined amounts. Files like `GSIS.csv`, `DBP.csv`, `CITY SAVINGS.csv`, `SJMO.csv` reflect these billed amounts.
    * `Total Deductions`: = SUM(`Withholding tax`, `GSIS Premium PS`, `PAG-IBIG Premium PS`, `PhilHEALTH Premium PS`, `All Loan Deductions`, `Other Contributions`).
    * `Net Amount Due`: = `Gross Compensation (TOTAL)` - `Total Deductions`.

    **Stream C: Allowances (RATA - `RATA*.csv`)**
    * `Representation Allowance` & `Transportation Allowance`: The monthly amount is fixed based on the position (e.g., Mayor gets highest, Dept Heads a standard amount, SB Members another).
    * *Formula (Exec):* `(Monthly RATA / Working Days in Month) * Actual Days Worked (from DTR)`. The `RATA exec.csv` likely applies this formula based on DTR input.
    * *Formula (SB):* `(Monthly RATA / Number of Sessions in Month) * Sessions Attended (from Minutes)`. The `RATA SB.csv` likely applies this.

    **Stream D: Other Benefits (Hazard, S&L - `hazard*.csv`, `S & L.csv`)**
    * `Hazard Pay`:
        * *Formula:* `(Monthly Rate / 22) * No. of Days * Hazard %`.
        * *Note:* `Monthly Rate` is the employee's `Basic Salary`. `22` is a standard assumed number of working days per month. `No. of Days` comes from DTR (RHU) or Accomplishment Report (MSWD). `Hazard %` is 25% for Health Workers, 20% for Social Workers (explicitly mentioned in `hazard HW & SW.csv`).
    * `Subsistence Allowance`:
        * *Formula:* `No of days * 50`. (`No of days` from DTR/Report). Rate (Php 50) is fixed by regulation and mentioned in `S & L.csv`.
    * `Laundry Allowance`:
        * *Formula:* `No of days * 6.818`. (`No of days` from DTR/Report). Rate (Php 6.818) is fixed by regulation and mentioned in `S & L.csv`.

### **Phase 3: Funding Certification (CAFOA)**

* **When:** Immediately after Phase 2 calculations are finalized and checked for accuracy. Before instructing the bank.
* **How:**
    1.  **Summarize Totals:** The payroll system/accountant sums up the *gross amounts* per expense type (Salaries, PERA, RATA RA, RATA TA, Hazard, S&L, GSIS GS, Pag-IBIG GS, PhilHealth GS, EC GS) for each specific payroll run (Exec Salary, SB RATA, etc.).
    2.  **Generate CAFOA Document:** Fill out the CAFOA form (`CAFOA*.csv` represents the data for this form). This includes:
        * Payee (DBP)
        * Particulars (e.g., "Payment of Salaries for December 2023")
        * Breakdown by Function/Allotment Class/Expense Code and the summarized Amount.
        * Total Amount Approved.
    3.  **Routing & Signing:** Route the CAFOA document for signatures:
        * Municipal Budget Officer (Certifies appropriation exists)
        * Municipal Treasurer (Certifies funds are available)
        * Municipal Accountant (Certifies obligation of allotment)

### **Phase 4: Disbursement to Employees (ADA)**

* **When:** After the corresponding CAFOA is fully signed and approved. Usually 1-3 days before the actual payday to allow for bank processing.
* **How:**
    1.  **Consolidate Net Pay:** For the main payroll runs (Exec, SB), the system adds the `Net Amount Due` from the Salary calculation (Stream A) and the `TOTAL ALLOWANCES` from the RATA calculation (Stream C) for each employee. Hazard and S&L might also be included here or paid via a separate ADA depending on LGU practice. Newly Hired ADAs (`ADA newly hired.csv`, `ADA SB newly hired.csv`) would only contain their net salary as they likely don't receive RATA/Hazard yet.
    2.  **Generate ADA Document:** Create the Authority to Debit Account letter (`ADA*.csv` represents the data). This includes:
        * LGU's DBP Current Account Number and total amount to be debited.
        * A detailed list: Employee Name, Employee's DBP Savings Account Number, Consolidated Net Amount to be credited.
    3.  **Signing & Submission:** The ADA is signed by authorized signatories (usually Treasurer and Mayor/Vice-Mayor) and submitted securely to DBP.
    4.  **Bank Processing:** DBP executes the instruction, debiting the LGU account and crediting individual employee accounts.

### **Phase 5: Remittance of Deductions to 3rd Parties**

* **When:** After payday, according to statutory deadlines (e.g., GSIS/Pag-IBIG/PhilHealth often by the 10th-15th of the *following* month; BIR tax by the 10th of the following month). Loan remittances might have specific due dates per the lender agreement.
* **How:**
    1.  **Generate Remittance Lists:** The system generates reports summarizing deductions per agency/lender (`BIR.csv`, `GSIS.csv`, `PAGIBIG*.csv`, `DBP.csv`, etc.). These lists include:
        * Employee Identifiers (Name, TIN, GSIS BP No., Pag-IBIG ID)
        * Breakdown of amounts (e.g., GSIS: Employee Share, Govt Share, Loan Type 1, Loan Type 2...). For BIR, it's just the Tax Withheld. For banks/co-ops, it's the total loan payment.
    2.  **Calculate Totals:** Sum the amounts for each agency/lender across all payroll runs (Exec, SB, Newly Hired).
    3.  **Prepare Payment:** Issue checks payable to each agency/lender for the total amount due.
    4.  **Submission:** Submit the remittance list along with the corresponding check to each entity (BIR, GSIS, Pag-IBIG, DBP, City Savings, SJMO). This is often done electronically now but the report generation step is similar.

### **Phase 6: Final Reporting & Documentation**

* **When:** Concurrent with or immediately after Phase 4 (Payslips) and Phase 5 (Summaries).
* **How:**
    1.  **Generate Payslips:** For each employee, compile all earnings (Basic, PERA, RATA, Hazard, S&L) and all deductions (Tax, Premiums, Loans, Others) for the period into a standard payslip format (`payslips*.csv`). This serves as the employee's official record.
    2.  **Generate Summary Reports:** Create consolidated summaries (`SUMMARY*.csv`) showing key totals per employee (Net Salary, RATA, Hazard, S&L, Total Received). This is used for internal accounting, reconciliation, and management reporting.
    3.  **Distribution/Archiving:** Distribute payslips to employees (physically or electronically) and archive all generated reports (Payrolls, CAFOAs, ADAs, Remittance Lists, Summaries) according to government auditing rules.

This provides a more granular look at the formulas, the sequence, and the triggers involved in each step of this LGU's payroll process.