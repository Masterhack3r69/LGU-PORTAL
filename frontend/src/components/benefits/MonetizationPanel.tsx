import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar, 
  Calculator, 
  CheckCircle, 
  Loader2,
  DollarSign,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { Employee } from '@/types/employee';
import { compensationService } from '@/services/compensationService';
import { employeeService } from '@/services/employeeService';
import { toast } from 'sonner';

interface MonetizationPanelProps {
  onSuccess: () => void;
}

interface LeaveBalance {
  employee_id: number;
  vacation_balance: number;
  sick_balance: number;
  total_balance: number;
}

export function MonetizationPanel({ onSuccess }: MonetizationPanelProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [daysToMonetize, setDaysToMonetize] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setCalculating] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadLeaveBalance();
    } else {
      setLeaveBalance(null);
      setCalculatedAmount(null);
    }
  }, [selectedEmployeeId]);

  useEffect(() => {
    if (selectedEmployeeId && daysToMonetize && parseFloat(daysToMonetize) > 0) {
      calculateMonetization();
    } else {
      setCalculatedAmount(null);
    }
  }, [selectedEmployeeId, daysToMonetize]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployees({ 
        limit: 1000, // Get all employees
        status: 'active' 
      });
      setEmployees(response.employees);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveBalance = async () => {
    if (!selectedEmployeeId) return;

    try {
      // This would need to be implemented in the backend
      // For now, we'll simulate leave balance data
      const mockBalance: LeaveBalance = {
        employee_id: selectedEmployeeId as number,
        vacation_balance: 15.5,
        sick_balance: 8.0,
        total_balance: 23.5
      };
      setLeaveBalance(mockBalance);
    } catch (error) {
      console.error('Failed to load leave balance:', error);
      toast.error('Failed to load leave balance');
    }
  };

  const calculateMonetization = async () => {
    if (!selectedEmployeeId || !daysToMonetize) return;

    const days = parseFloat(daysToMonetize);
    if (days <= 0) return;

    try {
      setCalculating(true);
      await compensationService.calculateBenefit(
        'MONETIZATION',
        selectedEmployeeId as number
      );
      
      // Calculate based on days to monetize
      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      if (selectedEmployee && selectedEmployee.current_monthly_salary) {
        const dailyRate = selectedEmployee.current_monthly_salary / 22; // 22 working days
        const amount = days * dailyRate;
        setCalculatedAmount(amount);
      }
    } catch (error) {
      console.error('Failed to calculate monetization:', error);
      toast.error('Failed to calculate monetization');
    } finally {
      setCalculating(false);
    }
  };

  const processMonetization = async () => {
    if (!selectedEmployeeId || !daysToMonetize || !calculatedAmount) {
      toast.error('Please complete all required fields');
      return;
    }

    const days = parseFloat(daysToMonetize);
    if (days <= 0) {
      toast.error('Days to monetize must be greater than 0');
      return;
    }

    if (leaveBalance && days > leaveBalance.total_balance) {
      toast.error('Days to monetize cannot exceed available leave balance');
      return;
    }

    try {
      setProcessing(true);
      await compensationService.processMonetization({
        employee_id: selectedEmployeeId as number,
        days_to_monetize: days,
        notes
      });
      
      toast.success('Leave monetization processed successfully');
      onSuccess();
      
      // Reset form
      setSelectedEmployeeId('');
      setDaysToMonetize('');
      setNotes('');
      setCalculatedAmount(null);
      setLeaveBalance(null);
    } catch (error) {
      console.error('Failed to process monetization:', error);
      toast.error('Failed to process monetization');
    } finally {
      setProcessing(false);
    }
  };

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
  const days = parseFloat(daysToMonetize) || 0;
  const isValidDays = days > 0 && (!leaveBalance || days <= leaveBalance.total_balance);

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Monetization
          </CardTitle>
          <CardDescription>
            Convert unused leave days to cash compensation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Leave monetization converts unused leave days to cash based on the employee's daily rate. 
              The leave balance will be automatically updated after processing.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Employee Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select
                value={selectedEmployeeId.toString()}
                onValueChange={(value) => setSelectedEmployeeId(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.first_name} {employee.last_name} ({employee.employee_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Days to Monetize */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Days to Monetize</label>
              <Input
                type="number"
                placeholder="Enter number of days"
                value={daysToMonetize}
                onChange={(e) => setDaysToMonetize(e.target.value)}
                min="0"
                step="0.5"
                max={leaveBalance?.total_balance || undefined}
              />
              {leaveBalance && (
                <p className="text-sm text-muted-foreground">
                  Available: {leaveBalance.total_balance} days
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              placeholder="Add processing notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Employee Information & Leave Balance */}
      {selectedEmployee && leaveBalance && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="font-medium">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Employee Number</span>
                <span className="font-medium">{selectedEmployee.employee_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monthly Salary</span>
                <span className="font-medium">
                  {compensationService.formatCurrency(selectedEmployee.current_monthly_salary || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Daily Rate</span>
                <span className="font-medium">
                  {compensationService.formatCurrency((selectedEmployee.current_monthly_salary || 0) / 22)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balance */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vacation Leave</span>
                <Badge variant="outline">{leaveBalance.vacation_balance} days</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sick Leave</span>
                <Badge variant="outline">{leaveBalance.sick_balance} days</Badge>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-medium">Total Available</span>
                <Badge variant="default">{leaveBalance.total_balance} days</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Alert */}
      {daysToMonetize && !isValidDays && leaveBalance && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Days to monetize ({days}) cannot exceed available leave balance ({leaveBalance.total_balance} days).
          </AlertDescription>
        </Alert>
      )}

      {/* Calculation Results */}
      {calculatedAmount !== null && isValidDays && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Monetization Calculation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Monetization Amount</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {compensationService.formatCurrency(calculatedAmount)}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Days to Monetize</span>
                  <span className="text-sm font-medium">{days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily Rate</span>
                  <span className="text-sm font-medium">
                    {selectedEmployee ? compensationService.formatCurrency((selectedEmployee.current_monthly_salary || 0) / 22) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Remaining Balance</span>
                  <span className="text-sm font-medium">
                    {leaveBalance ? (leaveBalance.total_balance - days).toFixed(1) : '-'} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Calculation</span>
                  <span className="text-sm font-medium">
                    {days} × Daily Rate
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Button */}
      <div className="flex justify-end">
        <Button
          onClick={processMonetization}
          disabled={
            processing || 
            !selectedEmployeeId || 
            !daysToMonetize ||
            !isValidDays ||
            calculatedAmount === null
          }
          size="lg"
        >
          {processing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          Process Monetization
        </Button>
      </div>
    </div>
  );
}