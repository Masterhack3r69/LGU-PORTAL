import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, RefreshCw, AlertCircle, CheckCircle, Play, Eye, Calculator, Users } from 'lucide-react';
import { toast } from 'sonner';
import { payrollService } from '@/services/payrollService';
import { EmployeePayrollHistory } from '@/components/payroll/EmployeePayrollHistory';
import type {
  PayrollPeriod,
  PayrollPeriodDetails,
  CreatePayrollPeriodForm,
  PayrollFilters,
  GovernmentRates
} from '@/types/payroll';
import { PAYROLL_STATUS_OPTIONS, MONTH_OPTIONS } from '@/types/payroll';

export const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State management
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriodDetails | null>(null);
  const [governmentRates, setGovernmentRates] = useState<GovernmentRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<PayrollFilters>({ page: 1, limit: 10 });

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRatesDialog, setShowRatesDialog] = useState(false);

  // Form state
  const [createForm, setCreateForm] = useState<CreatePayrollPeriodForm>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    period_number: 1,
    start_date: '',
    end_date: '',
    pay_date: ''
  });

  // Load data
  const loadPayrollPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await payrollService.getPayrollPeriods(filters);
      setPayrollPeriods(response.data);
    } catch (error) {
      console.error('Failed to load payroll periods:', error);
      toast.error('Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadGovernmentRates = useCallback(async () => {
    try {
      const response = await payrollService.getGovernmentRates();
      setGovernmentRates(response.data);
    } catch (error) {
      console.error('Failed to load government rates:', error);
    }
  }, []);

  useEffect(() => {
    loadPayrollPeriods();
    loadGovernmentRates();
  }, [loadPayrollPeriods, loadGovernmentRates]);

  // Form handlers
  const handleCreatePeriod = async () => {
    try {
      setActionLoading('create');
      
      if (!createForm.start_date || !createForm.end_date || !createForm.pay_date) {
        toast.error('Please fill in all required fields');
        return;
      }

      const validation = await payrollService.validatePayrollPeriod(
        createForm.year,
        createForm.month,
        createForm.period_number
      );

      if (!validation.isValid) {
        toast.error(validation.message);
        return;
      }

      await payrollService.createPayrollPeriod(createForm);
      toast.success('Payroll period created successfully');
      setShowCreateDialog(false);
      setCreateForm({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        period_number: 1,
        start_date: '',
        end_date: '',
        pay_date: ''
      });
      loadPayrollPeriods();
    } catch (error) {
      console.error('Failed to create payroll period:', error);
      toast.error('Failed to create payroll period');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGeneratePayroll = async (periodId: number) => {
    try {
      setActionLoading(`generate-${periodId}`);
      const response = await payrollService.generatePayroll({ period_id: periodId });
      
      if (response.success) {
        toast.success(
          `Payroll generated! ${response.data.payroll_items_created} items for ${response.data.employees_processed} employees.`
        );
        if (response.warnings) toast.warning(response.warnings);
        loadPayrollPeriods();
      }
    } catch (error) {
      console.error('Failed to generate payroll:', error);
      toast.error('Failed to generate payroll');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinalizePayroll = async (periodId: number) => {
    try {
      setActionLoading(`finalize-${periodId}`);
      await payrollService.finalizePayrollPeriod(periodId);
      toast.success('Payroll period finalized successfully');
      loadPayrollPeriods();
    } catch (error) {
      console.error('Failed to finalize payroll:', error);
      toast.error('Failed to finalize payroll');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (period: PayrollPeriod) => {
    try {
      setActionLoading(`details-${period.id}`);
      const response = await payrollService.getPayrollPeriod(period.id);
      setSelectedPeriod(response.data);
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Failed to load period details:', error);
      toast.error('Failed to load period details');
    } finally {
      setActionLoading(null);
    }
  };

  // Auto-fill dates when period changes
  useEffect(() => {
    if (createForm.year && createForm.month && createForm.period_number) {
      const year = createForm.year;
      const month = createForm.month;
      const isPeriod1 = createForm.period_number === 1;

      const startDate = isPeriod1 
        ? new Date(year, month - 1, 1)
        : new Date(year, month - 1, 16);

      const endDate = isPeriod1
        ? new Date(year, month - 1, 15)
        : new Date(year, month, 0);

      const payDate = new Date(endDate);
      payDate.setDate(payDate.getDate() + 5);

      setCreateForm(prev => ({
        ...prev,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        pay_date: payDate.toISOString().split('T')[0]
      }));
    }
  }, [createForm.year, createForm.month, createForm.period_number]);

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Only administrators can access the payroll management system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Manage payroll periods and employee payroll history</p>
        </div>
      </div>

      <Tabs defaultValue="periods" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="mr-2 h-4 w-4" />
            Employee Payroll
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="periods" className="space-y-4">
          {/* Payroll Periods Management */}
          <div className="flex justify-end gap-2">
            <Dialog open={showRatesDialog} onOpenChange={setShowRatesDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calculator className="mr-2 h-4 w-4" />
                  Gov. Rates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Government Contribution Rates (2025)</DialogTitle>
                  <DialogDescription>Current rates for government deductions</DialogDescription>
                </DialogHeader>
                {governmentRates && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Sample calculation for {payrollService.formatCurrency(governmentRates.sample_salary)}:
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries({
                        GSIS: governmentRates.rates.gsis.total,
                        'Pag-IBIG': governmentRates.rates.pagibig,
                        PhilHealth: governmentRates.rates.philhealth,
                        'BIR Tax': governmentRates.rates.bir_tax
                      }).map(([label, amount]) => (
                        <Card key={label}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">{label}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {payrollService.formatCurrency(amount)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="border-t pt-4 flex justify-between">
                      <span className="font-semibold">Total Deductions:</span>
                      <span className="text-xl font-bold">
                        {payrollService.formatCurrency(governmentRates.total_deductions)}
                      </span>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Period
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Payroll Period</DialogTitle>
                  <DialogDescription>Create a new payroll period for processing employee salaries</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={createForm.year}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        min={2020}
                        max={2030}
                      />
                    </div>
                    <div>
                      <Label htmlFor="month">Month</Label>
                      <Select
                        value={createForm.month.toString()}
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, month: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTH_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Period</Label>
                    <Select
                      value={createForm.period_number.toString()}
                      onValueChange={(value) => setCreateForm(prev => ({ ...prev, period_number: parseInt(value) as 1 | 2 }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Period 1 (1st-15th)</SelectItem>
                        <SelectItem value="2">Period 2 (16th-31st)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={createForm.start_date}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={createForm.end_date}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Pay Date</Label>
                      <Input
                        type="date"
                        value={createForm.pay_date}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, pay_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreatePeriod} disabled={actionLoading === 'create'}>
                      {actionLoading === 'create' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                      Create Period
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Year</Label>
              <Select
                value={filters.year?.toString() || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, year: value === 'all' ? undefined : parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Month</Label>
              <Select
                value={filters.month?.toString() || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, month: value === 'all' ? undefined : parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {MONTH_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as PayrollPeriod['status'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {PAYROLL_STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={loadPayrollPeriods} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Periods Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Payroll Periods</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading payroll periods...</span>
            </div>
          ) : payrollPeriods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No payroll periods found. Create your first payroll period to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Pay Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Total Pay</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollPeriods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">
                      {payrollService.formatPeriodName(period)}
                    </TableCell>
                    <TableCell>
                      {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(period.pay_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={payrollService.getStatusColor(period.status)}>
                        {period.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{period.employee_count || 0}</TableCell>
                    <TableCell>
                      {period.total_net_pay ? payrollService.formatCurrency(period.total_net_pay) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(period)}
                          disabled={actionLoading === `details-${period.id}`}
                        >
                          {actionLoading === `details-${period.id}` ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>

                        {period.status === 'Draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGeneratePayroll(period.id)}
                            disabled={actionLoading === `generate-${period.id}`}
                          >
                            {actionLoading === `generate-${period.id}` ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        {period.status === 'Processing' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFinalizePayroll(period.id)}
                            disabled={actionLoading === `finalize-${period.id}`}
                          >
                            {actionLoading === `finalize-${period.id}` ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

        </TabsContent>
        
        <TabsContent value="employees" className="space-y-4">
          {/* Employee Payroll History */}
          <EmployeePayrollHistory />
        </TabsContent>
      </Tabs>

      {/* Period Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPeriod && payrollService.formatPeriodName(selectedPeriod.period)}
            </DialogTitle>
            <DialogDescription>Detailed payroll information for this period</DialogDescription>
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
                      {payrollService.formatCurrency(selectedPeriod.summary.total_gross_pay)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Net Pay</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {payrollService.formatCurrency(selectedPeriod.summary.total_net_pay)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payroll Items */}
              <div>
                <h3 className="text-base font-semibold mb-4">Payroll Items</h3>
                {selectedPeriod.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No payroll items found for this period.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Days Worked</TableHead>
                        <TableHead>Basic Salary</TableHead>
                        <TableHead>Gross Pay</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPeriod.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {item.first_name} {item.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{item.employee_number}</div>
                            </div>
                          </TableCell>
                          <TableCell>{item.days_worked}/22</TableCell>
                          <TableCell>{payrollService.formatCurrency(item.basic_salary)}</TableCell>
                          <TableCell>{payrollService.formatCurrency(item.gross_pay)}</TableCell>
                          <TableCell>{payrollService.formatCurrency(item.total_deductions)}</TableCell>
                          <TableCell className="font-medium">
                            {payrollService.formatCurrency(item.net_pay)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};