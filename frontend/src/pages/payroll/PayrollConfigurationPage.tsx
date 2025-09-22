import { PayrollConfiguration } from '@/components/payroll/PayrollConfiguration';

export function PayrollConfigurationPage() {
  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Payroll Configuration</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Configure payroll settings, allowances, and deductions
            </p>
          </div>
        </div>
      </div>

      <PayrollConfiguration />
    </div>
  );
}