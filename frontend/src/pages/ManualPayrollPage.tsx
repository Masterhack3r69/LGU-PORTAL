import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Calculator, User, DollarSign, Eye, FileText, AlertCircle, Plus, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { employeeService } from '@/services/employeeService';
import type { Employee } from '@/types/employee';

// Types
interface EmployeePayrollDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EmployeePayrollDialog({ employee, open, onOpenChange }: EmployeePayrollDialogProps) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Employee Payroll Details</DialogTitle>
          <DialogDescription>
            Manual payroll processing for {employee.first_name} {employee.last_name} ({employee.employee_number})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Employee Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium">Employee Name</label>
              <p className="text-sm text-muted-foreground">
                {employee.first_name} {employee.last_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Employee Number</label>
              <p className="text-sm text-muted-foreground">{employee.employee_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Monthly Salary</label>
              <p className="text-sm text-muted-foreground">
                {employee.current_monthly_salary ? `₱${employee.current_monthly_salary.toLocaleString()}` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Manual Payroll Processing Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Manual Payroll Processing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Base Salary Information</label>
                  <div className="mt-2 space-y-2 p-3 border rounded">
                    <div className="flex justify-between text-sm">
                      <span>Monthly Salary:</span>
                      <span>₱{employee.current_monthly_salary?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Daily Rate:</span>
                      <span>₱{employee.current_daily_rate?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Days Worked:</span>
                      <span>22</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Additional Allowances</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overtime Pay:</span>
                      <span>₱2,500.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Special Allowance:</span>
                      <span>₱1,000.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Transportation:</span>
                      <span>₱1,500.00</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Allowance
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Deductions</label>
                  <div className="mt-2 space-y-2 p-3 border rounded">
                    <div className="flex justify-between text-sm">
                      <span>GSIS:</span>
                      <span>₱4,500.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>PhilHealth:</span>
                      <span>₱1,800.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pag-IBIG:</span>
                      <span>₱200.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Withholding Tax:</span>
                      <span>₱2,000.00</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Additional Deductions</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Late Deductions:</span>
                      <span>₱500.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Loan Payment:</span>
                      <span>₱2,000.00</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Deduction
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Summary */}
            <div className="p-4 bg-muted/30 rounded-lg border-2">
              <h4 className="font-semibold mb-3">Payroll Summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background rounded border">
                  <div className="text-sm text-muted-foreground">Gross Pay</div>
                  <div className="text-lg font-bold text-green-600">₱50,000.00</div>
                </div>
                <div className="text-center p-3 bg-background rounded border">
                  <div className="text-sm text-muted-foreground">Total Deductions</div>
                  <div className="text-lg font-bold text-red-600">₱11,000.00</div>
                </div>
                <div className="text-center p-3 bg-background rounded border">
                  <div className="text-sm text-muted-foreground">Net Pay</div>
                  <div className="text-lg font-bold text-blue-600">₱39,000.00</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payroll History Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payroll History</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="hidden sm:table-cell">Gross Pay</TableHead>
                    <TableHead className="hidden sm:table-cell">Deductions</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Placeholder data - will be populated from API */}
                  <TableRow>
                    <TableCell>
                      <div>
                        <div className="font-medium">2024-01 Period 1</div>
                        <div className="text-sm text-muted-foreground sm:hidden">
                          Gross: ₱45,000 | Deductions: ₱8,500
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">₱45,000.00</TableCell>
                    <TableCell className="hidden sm:table-cell">₱8,500.00</TableCell>
                    <TableCell className="font-semibold text-green-600">₱36,500.00</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div>
                        <div className="font-medium">2024-01 Period 2</div>
                        <div className="text-sm text-muted-foreground sm:hidden">
                          Gross: ₱45,000 | Deductions: ₱8,500
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">₱45,000.00</TableCell>
                    <TableCell className="hidden sm:table-cell">₱8,500.00</TableCell>
                    <TableCell className="font-semibold text-green-600">₱36,500.00</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <Settings className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button className="w-full sm:w-auto">
            <Calculator className="mr-2 h-4 w-4" />
            Process Payroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const ManualPayrollPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPayrollEmployee, setSelectedPayrollEmployee] = useState<number | null>(null);
  const [selectedEmployeeForDialog, setSelectedEmployeeForDialog] = useState<Employee | null>(null);
  const [showEmployeePayrollDialog, setShowEmployeePayrollDialog] = useState(false);

  // Event handlers
  const handleViewEmployeePayroll = (employee: Employee) => {
    setSelectedEmployeeForDialog(employee);
    setShowEmployeePayrollDialog(true);
  };

  // Data loading
  const loadEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getEmployees({});
      setEmployees(response.employees || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
    }
  }, []);

  // Auto-load data when component mounts
  React.useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Access control
  if (!isAdmin && !isEmployee) {
    return (
      <div className="container mx-auto space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Please log in to access the manual payroll system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center">
              <Calculator className="mr-2 h-5 w-5" />
              Manual Payroll Processing
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isAdmin 
                ? "Process individual employee payroll with manual adjustments and calculations" 
                : "View and manage your individual payroll records"}
            </p>
          </div>
          
          <div className="text-left sm:text-right">
            <div className="text-sm text-muted-foreground">User Role</div>
            <Badge className={isAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
              <User className="mr-1 h-3 w-3" />
              {isAdmin ? "Administrator" : "Employee"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isAdmin ? (
        <div className="space-y-4">
          {/* Employee Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calculator className="mr-2 h-5 w-5" />
                Individual Employee Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Manual Payroll Processing</AlertTitle>
                <AlertDescription>
                  Select an employee to view their payroll details, make manual adjustments, and process individual payroll entries. 
                  This is ideal for handling special cases, corrections, or one-off payments.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Employee</label>
                  <Select
                    value={selectedPayrollEmployee?.toString() || ''}
                    onValueChange={(value) => setSelectedPayrollEmployee(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose employee to process manually" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.first_name} {employee.last_name} ({employee.employee_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedPayrollEmployee && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        const employee = employees.find(emp => emp.id === selectedPayrollEmployee);
                        if (employee) handleViewEmployeePayroll(employee);
                      }}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View & Process Payroll
                    </Button>
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      View History
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <DollarSign className="mr-2 h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <Plus className="h-6 w-6" />
                  <span className="font-medium">Overtime Processing</span>
                  <span className="text-xs text-muted-foreground">Process overtime payments</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <Calculator className="h-6 w-6" />
                  <span className="font-medium">Bonus Calculations</span>
                  <span className="text-xs text-muted-foreground">Calculate special bonuses</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col space-y-2">
                  <FileText className="h-6 w-6" />
                  <span className="font-medium">Adjustment Entries</span>
                  <span className="text-xs text-muted-foreground">Create salary adjustments</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="mr-2 h-5 w-5" />
              My Individual Payroll Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Individual Payroll Records</AlertTitle>
              <AlertDescription>
                Your individual payroll records and manual adjustments will be displayed here. 
                You can view detailed breakdowns of your salary, allowances, and deductions.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4">
              <Button onClick={() => {
                if (user?.employee_id) {
                  const employee = employees.find(emp => emp.id === user.employee_id);
                  if (employee) handleViewEmployeePayroll(employee);
                }
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View My Payroll Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Payroll Dialog */}
      <EmployeePayrollDialog 
        employee={selectedEmployeeForDialog}
        open={showEmployeePayrollDialog}
        onOpenChange={setShowEmployeePayrollDialog}
      />
    </div>
  );
};