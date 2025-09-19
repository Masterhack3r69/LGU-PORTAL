import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, DollarSign, Minus, Users } from 'lucide-react';
import { AllowanceTypesManagement } from './AllowanceTypesManagement.tsx';
import { DeductionTypesManagement } from './DeductionTypesManagement.tsx';
import { EmployeeOverridesManagement } from './EmployeeOverridesManagement.tsx';

export function PayrollConfiguration() {
  const [activeConfigTab, setActiveConfigTab] = useState('allowances');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Payroll Configuration
        </CardTitle>
        <CardDescription>
          Manage allowance types, deduction types, and employee-specific overrides
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeConfigTab} onValueChange={setActiveConfigTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="allowances" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Allowance Types
            </TabsTrigger>
            <TabsTrigger value="deductions" className="flex items-center gap-2">
              <Minus className="h-4 w-4" />
              Deduction Types
            </TabsTrigger>
            <TabsTrigger value="overrides" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Employee Overrides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="allowances" className="space-y-4">
            <AllowanceTypesManagement />
          </TabsContent>

          <TabsContent value="deductions" className="space-y-4">
            <DeductionTypesManagement />
          </TabsContent>

          <TabsContent value="overrides" className="space-y-4">
            <EmployeeOverridesManagement />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}