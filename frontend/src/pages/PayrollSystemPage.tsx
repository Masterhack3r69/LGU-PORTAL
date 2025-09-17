import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  RefreshCw, AlertCircle, Eye, MoreHorizontal, ChevronDownIcon,
  Cog, User, DollarSign, Calculator, FileText, Settings, Plus, ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { employeeService } from '@/services/employeeService';
import { payrollSystemService } from '@/services/payrollSystemService';
import type { Employee } from '@/types/employee';
import type { PayrollPeriod, CreatePayrollPeriodForm } from '@/types/payrollSystem';
import { formatDateRange } from 'little-date';
import { type DateRange } from 'react-day-picker';

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
            Payroll information for {employee.first_name} {employee.last_name} ({employee.employee_number})
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

          {/* Manual Adjustments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Manual Adjustments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
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
                  </div>
                </div>
              </div>
              <div className="space-y-4">
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
          <Button className="w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            Generate Payslip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CreatePayrollPeriodCollapsibleProps {
  onCreatePeriod: (periodData: {
    dateRange: DateRange | undefined;
    period_number: 1 | 2;
    pay_date: Date | undefined;
  }) => void;
}

function CreatePayrollPeriodCollapsible({ onCreatePeriod }: CreatePayrollPeriodCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Set realistic default dates for the current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(currentYear, currentMonth, 1), // 1st of current month
    to: new Date(currentYear, currentMonth, 15)    // 15th of current month (same month)
  });
  const [periodNumber, setPeriodNumber] = useState<string>("1");
  
  // Set pay date to 5 days after end date (20th of same month)
  const [payDate, setPayDate] = useState<Date | undefined>(
    new Date(currentYear, currentMonth, 20) // 20th of current month
  );

  const handleSubmit = () => {
    onCreatePeriod({
      dateRange,
      period_number: parseInt(periodNumber) as 1 | 2,
      pay_date: payDate
    });
    setIsOpen(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button className="w-full justify-between" variant="outline">
          <div className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Create New Payroll Period
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/30">
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Create Payroll Period</AlertTitle>
            <AlertDescription>
              Select the date range for the new payroll period. The system will automatically process payroll for all employees within this period.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dates" className="text-sm font-medium">
                Date Range
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="dates" className="w-full justify-between font-normal">
                    {dateRange?.from && dateRange?.to
                      ? formatDateRange(dateRange.from, dateRange.to, {
                          includeTime: false
                        })
                      : 'Pick date range'}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      // Validate that both dates are in the same month
                      if (range?.from && range?.to) {
                        const fromMonth = range.from.getMonth();
                        const toMonth = range.to.getMonth();
                        const fromYear = range.from.getFullYear();
                        const toYear = range.to.getFullYear();
                        
                        if (fromYear !== toYear || fromMonth !== toMonth) {
                          toast.error('Start and end dates must be in the same month for payroll period validation');
                          return;
                        }
                        
                        // Ensure end date is after start date
                        if (range.to <= range.from) {
                          toast.error('End date must be after start date');
                          return;
                        }
                      }
                      
                      setDateRange(range);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paydate" className="text-sm font-medium">
                Pay Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" id="paydate" className="w-full justify-between font-normal">
                    {payDate ? payDate.toLocaleDateString() : 'Pick pay date'}
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={payDate}
                    onSelect={(date) => {
                      // Validate that pay date is after end date
                      if (date && dateRange?.to && date <= dateRange.to) {
                        toast.error('Pay date must be after the end date of the payroll period');
                        return;
                      }
                      setPayDate(date);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Period Number
            </Label>
            <RadioGroup value={periodNumber} onValueChange={setPeriodNumber} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="period1" />
                <Label htmlFor="period1" className="text-sm cursor-pointer font-normal">
                  Period 1 (1st - 15th of the month)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="period2" />
                <Label htmlFor="period2" className="text-sm cursor-pointer font-normal">
                  Period 2 (16th - End of the month)
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={!dateRange?.from || !dateRange?.to || !payDate}>
              <Cog className="mr-2 h-4 w-4" />
              Create Period
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Utility function for status colors
const getStatusColor = (status: string) => {
  const colors = {
    'Draft': 'bg-gray-100 text-gray-800',
    'Processing': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'CALCULATED': 'bg-blue-100 text-blue-800',
    'APPROVED': 'bg-green-100 text-green-800',
    'PAID': 'bg-purple-100 text-purple-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const PayrollSystemPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  // State
  const [activeTab, setActiveTab] = useState('automated');
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedPayrollEmployee, setSelectedPayrollEmployee] = useState<number | null>(null);
  const [selectedEmployeeForDialog, setSelectedEmployeeForDialog] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showEmployeePayrollDialog, setShowEmployeePayrollDialog] = useState(false);


  // Utility functions
  const formatPeriodName = (period: PayrollPeriod) => 
    `${period.year}-${String(period.month).padStart(2, '0')} Period ${period.period_number}`;

  // Event handlers
  const handleViewEmployeePayroll = (employee: Employee) => {
    setSelectedEmployeeForDialog(employee);
    setShowEmployeePayrollDialog(true);
  };

  const handleCreatePayrollPeriod = async (periodData: {
    dateRange: DateRange | undefined;
    period_number: 1 | 2;
    pay_date: Date | undefined;
  }) => {
    try {
      setActionLoading('create-period');
      
      if (!periodData.dateRange?.from || !periodData.dateRange?.to || !periodData.pay_date) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Extract year and month from the start date
      const startDate = periodData.dateRange.from;
      const year = startDate.getFullYear();
      const month = startDate.getMonth() + 1;

      const createForm: CreatePayrollPeriodForm = {
        year,
        month,
        period_number: periodData.period_number,
        start_date: periodData.dateRange.from.toISOString().split('T')[0],
        end_date: periodData.dateRange.to.toISOString().split('T')[0],
        pay_date: periodData.pay_date.toISOString().split('T')[0]
      };

      console.log('Creating payroll period with extracted data:', {
        ...createForm,
        dateRange: {
          from: periodData.dateRange.from.toISOString(),
          to: periodData.dateRange.to.toISOString()
        },
        extracted: { year, month },
        validation: {
          startDateYear: periodData.dateRange.from.getFullYear(),
          startDateMonth: periodData.dateRange.from.getMonth() + 1,
          extractedYear: year,
          extractedMonth: month,
          matches: year === periodData.dateRange.from.getFullYear() && month === (periodData.dateRange.from.getMonth() + 1)
        }
      });
      
      const response = await payrollSystemService.createPayrollPeriod(createForm);
      
      if (response.success) {
        toast.success('Payroll period created successfully with Processing status!');
        loadPayrollPeriods(); // Reload the periods list
      } else {
        throw new Error(response.message || 'Failed to create payroll period');
      }
    } catch (error) {
      console.error('Failed to create payroll period:', error);
      
      // Extract detailed error information
      let errorMessage = 'Failed to create payroll period';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; details?: { errors?: Array<{ msg?: string; message?: string }> } } } };
        const responseData = axiosError.response?.data;
        
        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.details?.errors && Array.isArray(responseData.details.errors)) {
          // Handle validation errors array from express-validator
          errorMessage = responseData.details.errors.map(err => err.msg || err.message || String(err)).join(', ');
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Data loading
  const loadPayrollPeriods = useCallback(async () => {
    if (!isAdmin || !user) return;
    
    try {
      setLoading(true);
      const response = await payrollSystemService.getPayrollPeriods({
        page: 1,
        limit: 50
      });
      setPayrollPeriods(response.data || []);
    } catch (error) {
      console.error('Failed to load payroll periods:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('401')) {
        toast.error('Authentication required. Please log in again.');
      } else if (errorMessage.includes('403')) {
        toast.error('Access denied. Administrator privileges required.');
      } else {
        toast.error('Failed to load payroll periods.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getEmployees({});
      setEmployees(response.employees || []);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error('Failed to load employees');
    }
  }, []);

  const handleGenerateAutomatedPayroll = async (periodId: number) => {
    try {
      setActionLoading(`generate-${periodId}`);
      
      const response = await payrollSystemService.generateAutomatedPayroll(periodId);
      if (response.success) {
        toast.success(`🤖 Automated Payroll Generated Successfully! ${response.data.payroll_items_created} items created.`);
        loadPayrollPeriods();
      } else {
        throw new Error(response.message || 'Failed to generate payroll');
      }
    } catch (error) {
      console.error('Failed to generate automated payroll:', error);
      toast.error('Failed to generate automated payroll');
    } finally {
      setActionLoading(null);
    }
  };

  // Auto-load data when component mounts
  React.useEffect(() => {
    loadPayrollPeriods();
    loadEmployees();
  }, [loadPayrollPeriods, loadEmployees]);

  // Access control
  if (!isAdmin && !isEmployee) {
    return (
      <div className="container mx-auto space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Please log in to access the payroll system.
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
              <DollarSign className="mr-2 h-5 w-5" />
              Payroll System
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {isAdmin 
                ? "Manage automated and manual payroll processing for employees" 
                : "View your payroll information and history"}
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TooltipProvider>
          <TabsList className="grid w-full grid-cols-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="automated" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <Cog className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Automated Processing</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>Automated Payroll Processing</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <TabsTrigger value="manual" className="flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-105">
                  <Calculator className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Manual Processing</span>
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent className="sm:hidden">
                <p>Manual Payroll Processing</p>
              </TooltipContent>
            </Tooltip>
          </TabsList>
        </TooltipProvider>

        {/* Automated Processing Tab */}
        <TabsContent value="automated" className="space-y-4">
          {isAdmin ? (
            <div className="space-y-4">
              {/* Create New Period */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Cog className="mr-2 h-5 w-5" />
                    Automated Payroll Processing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CreatePayrollPeriodCollapsible onCreatePeriod={handleCreatePayrollPeriod} />
                </CardContent>
              </Card>

              {/* Payroll Periods Table */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <CardTitle className="text-lg">Payroll Periods</CardTitle>
                    <Button onClick={loadPayrollPeriods} variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading payroll periods...</span>
                    </div>
                  ) : payrollPeriods.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No payroll periods found. Create a new period to get started.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead className="hidden sm:table-cell">Date Range</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payrollPeriods.map((period) => (
                            <TableRow key={period.id}>
                              <TableCell className="font-medium">
                                <div>
                                  <div>{formatPeriodName(period)}</div>
                                  <div className="text-sm text-muted-foreground sm:hidden">
                                    {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(period.status)}>
                                  {period.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {period.status === 'Draft' && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => {
                                        handleGenerateAutomatedPayroll(period.id);
                                      }}
                                      disabled={actionLoading === `generate-${period.id}`}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {actionLoading === `generate-${period.id}` ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Cog className="mr-1 h-4 w-4" />
                                          <span className="hidden sm:inline">Process Period</span>
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      {period.status !== 'Draft' && (
                                        <DropdownMenuItem>
                                          <FileText className="mr-2 h-4 w-4" />
                                          View Report
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Configure
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="mr-2 h-5 w-5" />
                  My Payroll Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Employee Payroll View</AlertTitle>
                  <AlertDescription>
                    Your automated payroll information and history will be displayed here. This feature is under development.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Manual Processing Tab */}
        <TabsContent value="manual" className="space-y-4">
          {isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calculator className="mr-2 h-5 w-5" />
                  Employee Payroll Processing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Individual Employee Processing</AlertTitle>
                  <AlertDescription>
                    Select an employee to view their payroll details, make manual adjustments, and process individual payroll entries.
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
                        <SelectValue placeholder="Choose employee to process" />
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
                        View Payroll Details
                      </Button>
                      <Button variant="outline">
                        <Calculator className="mr-2 h-4 w-4" />
                        Process Payroll
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="mr-2 h-5 w-5" />
                  My Payroll Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Individual Payroll Records</AlertTitle>
                  <AlertDescription>
                    Your individual payroll records and manual adjustments will be displayed here.
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
        </TabsContent>
      </Tabs>

      {/* Employee Payroll Dialog */}
      <EmployeePayrollDialog 
        employee={selectedEmployeeForDialog}
        open={showEmployeePayrollDialog}
        onOpenChange={setShowEmployeePayrollDialog}
      />


    </div>
  );
};