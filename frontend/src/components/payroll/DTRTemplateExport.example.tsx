/**
 * Example usage of DTRTemplateExport component
 * 
 * This file demonstrates how to use the DTRTemplateExport component
 * in a payroll management page or DTR import workflow.
 */

import { DTRTemplateExport } from './DTRTemplateExport';

// Example 1: Basic usage in a payroll period page
export function PayrollPeriodExample() {
  const periodId = 123;
  const periodName = '2024_January_Period1';

  return (
    <div className="space-y-4">
      <h2>Payroll Period Management</h2>
      
      {/* Export DTR Template Button */}
      <DTRTemplateExport 
        periodId={periodId} 
        periodName={periodName} 
      />
    </div>
  );
}

// Example 2: Usage with disabled state
export function DisabledStateExample() {
  const periodId = 123;
  const periodName = '2024_January_Period1';
  const isPeriodFinalized = true;

  return (
    <div className="space-y-4">
      <h2>Finalized Period</h2>
      
      {/* Disabled when period is finalized */}
      <DTRTemplateExport 
        periodId={periodId} 
        periodName={periodName}
        disabled={isPeriodFinalized}
      />
    </div>
  );
}

// Example 3: Usage in a card layout
export function CardLayoutExample() {
  const periodId = 123;
  const periodName = '2024_January_Period1';

  return (
    <div className="border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">DTR Import</h3>
          <p className="text-sm text-muted-foreground">
            Export template, fill attendance data, and import
          </p>
        </div>
        
        <DTRTemplateExport 
          periodId={periodId} 
          periodName={periodName} 
        />
      </div>
    </div>
  );
}
