import { PayrollConfiguration } from '@/components/payroll/PayrollConfiguration';

export function PayrollConfigurationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payroll Configuration</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configure payroll settings, allowances, and deductions
          </p>
        </div>
      </div>

      <PayrollConfiguration />
    </div>
  );
}