import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { payrollService } from '../services/payrollService';
import type {
  ManualPayrollDetails,
  ManualPayrollCalculation,
  PayrollPeriod,
  ManualPayrollEmployee,
  PayrollItem
} from '../types/payroll';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Calculator, 
  Save, 
  Users,
  RefreshCw,
  CheckCircle,
  Search,
  History
} from 'lucide-react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: string;
}

interface EmployeePayrollDialogProps {
  employee: ManualPayrollEmployee | null;
  payrollPeriods: PayrollPeriod[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EmployeePayrollDialog: React.FC<EmployeePayrollDialogProps> = ({
  employee,
  payrollPeriods,
  isOpen,
  onOpenChange,
  onSuccess
}) => {
  const toast = (options: ToastOptions) => {
    console.log('Toast:', options);
    alert(options.description || options.title);
  };
  
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [payrollDetails, setPayrollDetails] = useState<ManualPayrollDetails | null>(null);
  const [calculation, setCalculation] = useState<ManualPayrollCalculation | null>(null);
  const [payrollHistory, setPayrollHistory] = useState<PayrollItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [daysWorked, setDaysWorked] = useState<number>(22);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);
  const [holidayHours, setHolidayHours] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (employee && selectedPeriodId) {
      loadPayrollDetails();
    }
    if (employee && isOpen) {
      loadPayrollHistory();
    }
  }, [employee, selectedPeriodId, isOpen]);

  const loadPayrollHistory = async () => {
    if (!employee) return;
    setIsLoadingHistory(true);
    try {
      const response = await payrollService.getManualPayrollHistory(employee.id, { limit: 10 });
      if (response.success) {
        setPayrollHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading payroll history:', error);
      toast({
        title: "Error",
        description: "Failed to load payroll history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadPayrollDetails = async () => {
    if (!employee || !selectedPeriodId) return;
    setIsLoading(true);
    try {
      const response = await payrollService.getEmployeeManualPayrollDetails(employee.id, selectedPeriodId);
      if (response.success) {
        setPayrollDetails(response.data);
      }
    } catch (error) {
      console.error('Error loading payroll details:', error);
      toast({
        title: "Error",
        description: "Failed to load payroll details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePayroll = async () => {
    if (!employee || !selectedPeriodId) return;
    setIsCalculating(true);
    try {
      const response = await payrollService.calculateManualPayroll({
        employee_id: employee.id,
        period_id: selectedPeriodId,
        days_worked: daysWorked,
        overtime_hours: overtimeHours,
        holiday_hours: holidayHours,
        notes: notes
      });

      if (response.success) {
        setCalculation(response.data);
        toast({ title: "Success", description: "Payroll calculated successfully with automated allowances and deductions" });
      }
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast({ title: "Error", description: "Failed to calculate payroll", variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  const processPayroll = async () => {
    if (!employee || !selectedPeriodId || !calculation) return;
    setIsProcessing(true);
    try {
      const response = await payrollService.processManualPayroll({
        employee_id: employee.id,
        period_id: selectedPeriodId,
        calculation_data: calculation.calculation,
        notes: notes,
        override_existing: true
      });

      if (response.success) {
        toast({ title: "Success", description: "Payroll processed successfully" });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({ title: "Error", description: "Failed to process payroll", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Manual Payroll Processing
          </DialogTitle>
          <DialogDescription>
            Process payroll for {employee?.first_name} {employee?.last_name} 
            {employee?.employee_number && ` (${employee.employee_number})`}
            - Allowances and deductions automatically loaded from system configuration
          </DialogDescription>
        </DialogHeader>

        {employee && (
          <div className="space-y-6">
            {/* Period Selection */}
            <div>
              <Label>Payroll Period</Label>
              <Select
                value={selectedPeriodId?.toString() || ''}
                onValueChange={(value) => setSelectedPeriodId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payroll period" />
                </SelectTrigger>
                <SelectContent>
                  {payrollPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id.toString()}>
                      <div className="flex justify-between items-center w-full">
                        <span>{period.year} - {period.month === 1 ? 'January' : period.month === 2 ? 'February' : period.month === 3 ? 'March' : period.month === 4 ? 'April' : period.month === 5 ? 'May' : period.month === 6 ? 'June' : period.month === 7 ? 'July' : period.month === 8 ? 'August' : period.month === 9 ? 'September' : period.month === 10 ? 'October' : period.month === 11 ? 'November' : 'December'} (Period {period.period_number})</span>
                        <Badge variant={period.status === 'Draft' ? 'secondary' : 'default'}>
                          {period.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="calculation" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="calculation">Calculation</TabsTrigger>
                <TabsTrigger value="result">Result</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="calculation" className="space-y-4">
                {/* Auto-Calculated Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Automated Calculation</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Allowances and deductions are automatically loaded from your system configuration.
                        Only basic salary parameters need to be specified.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Calculation Parameters */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Days Worked</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={daysWorked}
                      onChange={(e) => setDaysWorked(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Overtime Hours</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={overtimeHours}
                      onChange={(e) => setOvertimeHours(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Holiday Hours</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={holidayHours}
                      onChange={(e) => setHolidayHours(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Enter any additional notes for this payroll processing..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>

                {/* Configured Allowances & Deductions Preview */}
                {payrollDetails && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-green-700">Configured Allowances</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {payrollDetails.current_allowances && payrollDetails.current_allowances.length > 0 ? (
                          <div className="space-y-2">
                            {payrollDetails.current_allowances.map((allowance, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{allowance.allowance_name}</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(allowance.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No allowances configured</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-red-700">Standard Deductions</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>GSIS</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(payrollDetails.standard_deductions?.gsis || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pag-IBIG</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(payrollDetails.standard_deductions?.pagibig || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>PhilHealth</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(payrollDetails.standard_deductions?.philhealth || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax</span>
                            <span className="font-medium text-red-600">
                              {formatCurrency(payrollDetails.standard_deductions?.tax || 0)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Calculate Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={calculatePayroll}
                    disabled={!selectedPeriodId || isCalculating || isLoading}
                    className="w-32"
                  >
                    {isCalculating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="result" className="space-y-4">
                {calculation ? (
                  <div className="space-y-6">
                    {/* Processing Summary Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-900">Payroll Processing Complete</h3>
                          <p className="text-blue-700 text-sm mt-1">
                            Processed on {new Date(calculation.calculation_date).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <div className="text-green-600 text-sm flex items-center gap-1">
                            ✓ Automatically calculated using configured allowances and deductions
                          </div>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </div>

                    {/* Net Pay Highlight */}
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <p className="text-sm text-green-600 font-medium">NET PAY</p>
                          <p className="text-4xl font-bold text-green-800 mt-2">
                            {formatCurrency(calculation.calculation.net_pay)}
                          </p>
                          <p className="text-sm text-green-600 mt-1">
                            For {calculation.calculation.days_worked} days worked
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Process Button */}
                    <div className="flex justify-center">
                      <Button
                        onClick={processPayroll}
                        disabled={isProcessing}
                        size="lg"
                        className="w-40"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Process Payroll
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No calculation results yet. Please calculate payroll first.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {isLoadingHistory ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-500">Loading payroll history...</p>
                  </div>
                ) : payrollHistory.length > 0 ? (
                  <div className="space-y-4">
                    {payrollHistory.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Payroll processed on {new Date(item.created_at).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground">Net Pay: {formatCurrency(item.net_pay)}</p>
                          </div>
                          <Badge>Processed</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No payroll history found for this employee.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export function ManualPayrollPage() {
  const { isAuthenticated } = useAuth();
  const [employees, setEmployees] = useState<ManualPayrollEmployee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<ManualPayrollEmployee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const toast = (options: ToastOptions) => {
    console.log('Toast:', options);
    alert(options.description || options.title);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [employeesResponse, periodsResponse] = await Promise.all([
        apiService.get<{ success: boolean; data: ManualPayrollEmployee[] }>('/employees'),
        payrollService.getPayrollPeriods({ status: 'Draft', limit: 20 })
      ]);

      if (employeesResponse.success) {
        setEmployees(employeesResponse.data.filter(emp => emp.employment_status === 'Active'));
      }

      if (periodsResponse.success) {
        setPayrollPeriods(periodsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEmployeeSelect = (employee: ManualPayrollEmployee) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    // Refresh data or show success message
    toast({ title: "Success", description: "Payroll processed successfully" });
  };

  if (!isAuthenticated) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Manual Payroll Processing</h1>
            <p className="text-muted-foreground">
              Process payroll for individual employees with automated allowances and deductions
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employee List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading employees...</p>
          </div>
        ) : filteredEmployees.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEmployeeSelect(employee)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {employee.employee_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {employee.plantilla_position}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Process
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No employees found matching your search.' : 'No active employees found.'}
            </p>
          </div>
        )}
      </div>

      {/* Employee Payroll Dialog */}
      <EmployeePayrollDialog
        employee={selectedEmployee}
        payrollPeriods={payrollPeriods}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}

export default ManualPayrollPage;