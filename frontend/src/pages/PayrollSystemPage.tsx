import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { 
  RefreshCw, AlertCircle, Eye, MoreHorizontal, ChevronDownIcon,
  Cog, User, DollarSign, FileText, Settings, Plus, ChevronDown,
  CheckCircle, XCircle
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
import { payrollSystemService } from '@/services/payrollSystemService';
import type { PayrollPeriod, CreatePayrollPeriodForm } from '@/types/payrollSystem';
import { formatDateRange } from 'little-date';
import { type DateRange } from 'react-day-picker';



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
    // Validate before submitting
    if (!dateRange?.from || !dateRange?.to || !payDate) {
      toast.error('Please select all required fields');
      return;
    }
    
    // Validate date range is in same month
    const fromMonth = dateRange.from.getMonth();
    const toMonth = dateRange.to.getMonth();
    const fromYear = dateRange.from.getFullYear();
    const toYear = dateRange.to.getFullYear();
    
    if (fromYear !== toYear || fromMonth !== toMonth) {
      toast.error('Start and end dates must be in the same month for payroll period validation');
      return;
    }
    
    // Validate end date is after start date
    if (dateRange.to <= dateRange.from) {
      toast.error('End date must be after start date');
      return;
    }
    
    // Validate pay date is after end date
    if (payDate <= dateRange.to) {
      toast.error('Pay date must be after the end date');
      return;
    }
    
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
                    onSelect={setDateRange}
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
                    onSelect={setPayDate}
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
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);


  // Utility functions
  const formatPeriodName = (period: PayrollPeriod) => 
    `${period.year}-${String(period.month).padStart(2, '0')} Period ${period.period_number}`;

  // Event handlers

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

      // Helper function to format date without timezone issues
      const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const createForm: CreatePayrollPeriodForm = {
        year,
        month,
        period_number: periodData.period_number,
        start_date: formatDateForAPI(periodData.dateRange.from),
        end_date: formatDateForAPI(periodData.dateRange.to),
        pay_date: formatDateForAPI(periodData.pay_date)
      };

      console.log('Creating payroll period with extracted data:', {
        ...createForm,
        originalDates: {
          from: periodData.dateRange.from.toString(),
          to: periodData.dateRange.to.toString(),
          payDate: periodData.pay_date.toString()
        },
        formattedDates: {
          start_date: createForm.start_date,
          end_date: createForm.end_date,
          pay_date: createForm.pay_date
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
  }, [loadPayrollPeriods]);

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
                ? "Manage automated payroll processing for all employees with system-wide period management" 
                : "View your automated payroll information and history"}
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

      {/* Main Content - Automated Processing Only */}
      <div className="space-y-4">
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
                          <TableHead className="hidden md:table-cell text-right">Total Net Pay</TableHead>
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
                                <div className="text-sm text-muted-foreground md:hidden">
                                  Net: ₱{(period.total_net_pay || 0).toLocaleString()}
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
                            <TableCell className="hidden md:table-cell text-right">
                              <div className="font-medium">
                                ₱{(period.total_net_pay || 0).toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {period.employee_count || 0} employees
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  
                                  {/* Process Period - only for Draft status */}
                                  {period.status === 'Draft' && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handleGenerateAutomatedPayroll(period.id)}
                                        disabled={actionLoading === `generate-${period.id}`}
                                      >
                                        {actionLoading === `generate-${period.id}` ? (
                                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <Cog className="mr-2 h-4 w-4" />
                                        )}
                                        Process Period
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  
                                  {/* View Details */}
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  
                                  {/* Reports - only for non-Draft status */}
                                  {period.status !== 'Draft' && (
                                    <DropdownMenuItem>
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Report
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuSeparator />
                                  
                                  {/* Status Change Actions */}
                                  {period.status === 'Processing' && (
                                    <>
                                      <DropdownMenuItem className="text-green-600">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Completed
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel Period
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  
                                  {/* Configure - for Draft and Processing */}
                                  {(period.status === 'Draft' || period.status === 'Processing') && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Configure
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                My Automated Payroll Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Employee Automated Payroll View</AlertTitle>
                <AlertDescription>
                  Your automated payroll information and history will be displayed here. This feature processes your regular salary, allowances, and deductions automatically.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>


    </div>
  );
};