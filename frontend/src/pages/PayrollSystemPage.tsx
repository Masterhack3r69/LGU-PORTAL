import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  RefreshCw, AlertCircle, Eye, ChevronDownIcon,
  Cog, User, DollarSign, Settings, Plus, ChevronDown,
  CheckCircle, XCircle, Play, Calendar as CalendarIcon, History, Save
} from 'lucide-react';
import { toast } from 'sonner';
import { payrollSystemService } from '@/services/payrollSystemService';
import { payrollService } from '@/services/payrollService';
import type { PayrollPeriod, CreatePayrollPeriodForm, PayrollSystemDetails, PayrollAllowanceType, EmployeeAllowance } from '@/types/payrollSystem';
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
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollSystemDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  
  // Employee allowance selection state
  const [availableAllowanceTypes, setAvailableAllowanceTypes] = useState<PayrollAllowanceType[]>([]);
  const [employeeAllowances, setEmployeeAllowances] = useState<EmployeeAllowance[]>([]);
  const [selectedAllowances, setSelectedAllowances] = useState<{[key: number]: { selected: boolean; amount: number }}>({});
  const [allowanceLoading, setAllowanceLoading] = useState(false);
  const [showAllowanceDialog, setShowAllowanceDialog] = useState(false);


  // Utility functions
  const formatPeriodName = (period: PayrollPeriod) => 
    `${period.year}-${String(period.month).padStart(2, '0')} Period ${period.period_number}`;

  // Filter periods by status
  const activePeriods = payrollPeriods.filter(period => 
    period.status === 'Draft' || period.status === 'Processing'
  );
  const completedPeriods = payrollPeriods.filter(period => 
    period.status === 'Completed' || period.status === 'Cancelled'
  );

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

  // Load allowance types for employee selection
  const loadAllowanceTypes = useCallback(async () => {
    if (!user) return;
    
    try {
      setAllowanceLoading(true);
      const response = await payrollSystemService.getAllowanceTypes();
      if (response.success) {
        setAvailableAllowanceTypes(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load allowance types:', error);
      toast.error('Failed to load allowance types.');
    } finally {
      setAllowanceLoading(false);
    }
  }, [user]);

  // Load employee's current allowances
  const loadEmployeeAllowances = useCallback(async () => {
    if (!user?.employee_id && !isEmployee) return;
    
    try {
      setAllowanceLoading(true);
      const employeeId = user?.employee_id;
      if (!employeeId) return;
      
      const response = await payrollSystemService.getEmployeeAllowances(employeeId);
      if (response.success) {
        setEmployeeAllowances(response.data || []);
        
        // Initialize selected allowances state
        const initialSelections: {[key: number]: { selected: boolean; amount: number }} = {};
        response.data?.forEach(allowance => {
          initialSelections[allowance.allowance_type_id] = {
            selected: allowance.is_active,
            amount: allowance.amount
          };
        });
        setSelectedAllowances(initialSelections);
      }
    } catch (error) {
      console.error('Failed to load employee allowances:', error);
      toast.error('Failed to load your allowances.');
    } finally {
      setAllowanceLoading(false);
    }
  }, [user, isEmployee]);

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

  const handleViewDetails = async (period: PayrollPeriod) => {
    try {
      setActionLoading(`details-${period.id}`);
      const response = await payrollSystemService.getPayrollComputation(period.id);
      if (response.success) {
        setSelectedPeriod(response.data);
        setShowDetailsDialog(true);
      }
    } catch (error) {
      console.error('Failed to load period details:', error);
      toast.error('Failed to load period details');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCompleted = async (periodId: number) => {
    try {
      setActionLoading(`complete-${periodId}`);
      const response = await payrollService.finalizePayrollPeriod(periodId);
      if (response.success) {
        toast.success(`Period marked as completed! ${response.data.payroll_items_processed} payroll items processed.`);
        loadPayrollPeriods();
        // Switch to history tab to show the completed period
        setActiveTab('history');
      } else {
        throw new Error(response.message || 'Failed to mark as completed');
      }
    } catch (error) {
      console.error('Failed to mark as completed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark as completed';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelPeriod = async (periodId: number) => {
    try {
      setActionLoading(`cancel-${periodId}`);
      // TODO: Implement cancel API endpoint when available
      // For now, show a message that this feature is coming soon
      toast.warning('Cancel functionality is not yet implemented. Please contact your administrator.');
      // Uncomment when backend endpoint is available:
      // const response = await payrollService.cancelPayrollPeriod(periodId);
      // if (response.success) {
      //   toast.success('Period cancelled successfully');
      //   loadPayrollPeriods();
      // }
    } catch (error) {
      console.error('Failed to cancel period:', error);
      toast.error('Failed to cancel period');
    } finally {
      setActionLoading(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConfigurePeriod = (_periodId: number) => {
    // TODO: Implement configuration navigation or dialog
    toast.info('Configuration panel coming soon. This will allow you to adjust period settings.');
  };

  // Handle allowance selection
  const handleAllowanceToggle = (allowanceTypeId: number, checked: boolean) => {
    setSelectedAllowances(prev => ({
      ...prev,
      [allowanceTypeId]: {
        selected: checked,
        amount: prev[allowanceTypeId]?.amount || 0
      }
    }));
  };

  const handleAllowanceAmountChange = (allowanceTypeId: number, amount: number) => {
    setSelectedAllowances(prev => ({
      ...prev,
      [allowanceTypeId]: {
        ...prev[allowanceTypeId],
        amount: amount
      }
    }));
  };

  const handleSaveAllowances = async () => {
    if (!user?.employee_id) return;
    
    try {
      setActionLoading('save-allowances');
      const employeeId = user.employee_id;
      
      const allowancesToUpdate = Object.entries(selectedAllowances)
        .filter(([, config]) => config.selected && config.amount > 0)
        .map(([allowanceTypeId, config]) => ({
          allowance_type_id: parseInt(allowanceTypeId),
          amount: config.amount,
          effective_date: new Date().toISOString().split('T')[0],
          is_active: true
        }));
      
      const response = await payrollSystemService.updateEmployeeAllowances(employeeId, {
        allowances: allowancesToUpdate
      });
      
      if (response.success) {
        toast.success('Allowances updated successfully!');
        loadEmployeeAllowances();
        setShowAllowanceDialog(false);
      } else {
        throw new Error(response.message || 'Failed to update allowances');
      }
    } catch (error) {
      console.error('Failed to save allowances:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save allowances';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Auto-load data when component mounts
  React.useEffect(() => {
    loadPayrollPeriods();
    if (isEmployee) {
      loadAllowanceTypes();
      loadEmployeeAllowances();
    }
  }, [loadPayrollPeriods, loadAllowanceTypes, loadEmployeeAllowances, isEmployee]);

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

            {/* Payroll Periods with Tabs */}
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
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active" className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Active ({activePeriods.length})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      History ({completedPeriods.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="mt-6">
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading payroll periods...</span>
                      </div>
                    ) : activePeriods.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No active payroll periods found. Create a new period to get started.
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {activePeriods.map((period) => (
                          <Card key={period.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="text-lg">
                                    {formatPeriodName(period)}
                                  </CardTitle>
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(period.status)}>
                                  {period.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Employees</div>
                                  <div className="text-xl font-semibold">{period.employee_count || 0}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Total Net Pay</div>
                                  <div className="text-xl font-semibold text-green-600">
                                    ₱{(period.total_net_pay || 0).toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Pay Date</div>
                                  <div className="text-sm font-medium">
                                    {new Date(period.pay_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 justify-end">
                                {/* View Details Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(period)}
                                  disabled={actionLoading === `details-${period.id}`}
                                >
                                  {actionLoading === `details-${period.id}` ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                  <span className="ml-1">View Details</span>
                                </Button>
                                
                                {/* Process Button - only for Draft status */}
                                {period.status === 'Draft' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleGenerateAutomatedPayroll(period.id)}
                                    disabled={actionLoading === `generate-${period.id}`}
                                  >
                                    {actionLoading === `generate-${period.id}` ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                    <span className="ml-1">Process</span>
                                  </Button>
                                )}
                                
                                {/* Configure Button - for Draft and Processing */}
                                {(period.status === 'Draft' || period.status === 'Processing') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConfigurePeriod(period.id)}
                                    disabled={actionLoading?.includes(period.id.toString())}
                                  >
                                    <Settings className="h-4 w-4" />
                                    <span className="ml-1">Configure</span>
                                  </Button>
                                )}
                                
                                {/* Complete Button - for Processing status */}
                                {period.status === 'Processing' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => handleMarkCompleted(period.id)}
                                    disabled={actionLoading === `complete-${period.id}`}
                                  >
                                    {actionLoading === `complete-${period.id}` ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    <span className="ml-1">Complete</span>
                                  </Button>
                                )}
                                
                                {/* Cancel Button - for Processing status */}
                                {period.status === 'Processing' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleCancelPeriod(period.id)}
                                    disabled={actionLoading === `cancel-${period.id}`}
                                  >
                                    {actionLoading === `cancel-${period.id}` ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                    <span className="ml-1">Cancel</span>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-6">
                    {loading ? (
                      <div className="flex justify-center items-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading payroll history...</span>
                      </div>
                    ) : completedPeriods.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No completed payroll periods found.
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {completedPeriods.map((period) => (
                          <Card key={period.id} className="hover:shadow-md transition-shadow opacity-90">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="text-lg">
                                    {formatPeriodName(period)}
                                  </CardTitle>
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(period.status)}>
                                  {period.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Employees</div>
                                  <div className="text-xl font-semibold">{period.employee_count || 0}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Total Net Pay</div>
                                  <div className="text-xl font-semibold text-green-600">
                                    ₱{(period.total_net_pay || 0).toLocaleString()}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-muted-foreground">Pay Date</div>
                                  <div className="text-sm font-medium">
                                    {new Date(period.pay_date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 justify-end">
                                {/* View Details Button - always available for history */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(period)}
                                  disabled={actionLoading === `details-${period.id}`}
                                >
                                  {actionLoading === `details-${period.id}` ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                  <span className="ml-1">View Details</span>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                </Tabs>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Employee Allowance Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="mr-2 h-5 w-5" />
                  My Payroll Allowances
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Manage Your Allowances</AlertTitle>
                  <AlertDescription>
                    Select and configure the allowance types you want to include in your payroll processing. These will be applied to your salary calculations.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current allowances: {employeeAllowances.filter(a => a.is_active).length} active
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowAllowanceDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Manage Allowances
                  </Button>
                </div>
                
                {/* Current Allowances Display */}
                {employeeAllowances.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Active Allowances:</h4>
                    <div className="grid gap-2">
                      {employeeAllowances
                        .filter(allowance => allowance.is_active)
                        .map((allowance) => (
                          <div key={allowance.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div>
                              <div className="font-medium">{allowance.allowance_name}</div>
                              <div className="text-sm text-muted-foreground">{allowance.allowance_code}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">₱{allowance.amount.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">
                                {allowance.is_monthly ? 'Monthly' : 'Fixed'}
                                {allowance.is_prorated && ' • Prorated'}
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Employee Payroll Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <DollarSign className="mr-2 h-5 w-5" />
                  My Payroll Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Payroll Processing</AlertTitle>
                  <AlertDescription>
                    Your payroll will be processed using your selected allowances and standard deductions. View your payroll history and current period information here.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Employee Allowance Selection Dialog */}
      <Dialog open={showAllowanceDialog} onOpenChange={setShowAllowanceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Your Payroll Allowances</DialogTitle>
            <DialogDescription>
              Select the allowance types you want to include in your payroll and set their amounts. These will be applied during payroll processing.
            </DialogDescription>
          </DialogHeader>
          
          {allowanceLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading allowance types...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {availableAllowanceTypes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No allowance types available.
                </div>
              ) : (
                <div className="grid gap-4">
                  {availableAllowanceTypes.map((allowanceType) => {
                    const isSelected = selectedAllowances[allowanceType.id]?.selected || false;
                    const amount = selectedAllowances[allowanceType.id]?.amount || 0;
                    
                    return (
                      <Card key={allowanceType.id} className={`transition-all ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => 
                                  handleAllowanceToggle(allowanceType.id, checked as boolean)
                                }
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{allowanceType.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Code: {allowanceType.code}
                                </div>
                                {allowanceType.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {allowanceType.description}
                                  </div>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {allowanceType.is_monthly ? 'Monthly' : 'Fixed'}
                                  </Badge>
                                  {allowanceType.is_prorated && (
                                    <Badge variant="outline" className="text-xs">
                                      Prorated
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="w-32">
                                <Label htmlFor={`amount-${allowanceType.id}`} className="text-sm">
                                  Amount (₱)
                                </Label>
                                <Input
                                  id={`amount-${allowanceType.id}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={amount}
                                  onChange={(e) => 
                                    handleAllowanceAmountChange(
                                      allowanceType.id, 
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  placeholder="0.00"
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllowanceDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveAllowances}
                  disabled={actionLoading === 'save-allowances'}
                  className="flex items-center gap-2"
                >
                  {actionLoading === 'save-allowances' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Allowances
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Period Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPeriod && formatPeriodName(selectedPeriod.period)}
            </DialogTitle>
            <DialogDescription>
              Detailed payroll information for this period
            </DialogDescription>
          </DialogHeader>
          
          {selectedPeriod && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedPeriod.summary.employee_count}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Gross Pay</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₱{selectedPeriod.summary.total_gross_pay.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Net Pay</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₱{selectedPeriod.summary.total_net_pay.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Employee List */}
              <div>
                <h3 className="text-base font-semibold mb-4">Payroll Items</h3>
                {selectedPeriod.items && selectedPeriod.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No payroll items found for this period.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {selectedPeriod.items?.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {item.first_name} {item.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{item.employee_number}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              ₱{item.net_pay.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.days_worked} days worked
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};