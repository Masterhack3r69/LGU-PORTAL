import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, 
  Calendar, 
  Calculator, 
  FileText, 
  Settings, 
  Users, 
  DollarSign,
  Play,
  Lock,
  Unlock,
  Check,
  Eye
} from 'lucide-react';
import payrollService from '@/services/payrollService';
import type { PayrollPeriod, PayrollSummary, PayrollItem } from '@/types/payroll';

export function AdminPayrollPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('periods');

  // Form states
  const [newPeriodData, setNewPeriodData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    period_number: 1
  });

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadSummary(selectedPeriod.id);
      loadPayrollItems(selectedPeriod.id);
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const response = await payrollService.getPeriods();
      if (response.success) {
        setPeriods(response.data);
        if (response.data.length > 0 && !selectedPeriod) {
          setSelectedPeriod(response.data[0]);
        }
      }
    } catch (error) {
      toast.error('Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (periodId: number) => {
    try {
      const response = await payrollService.getPayrollSummary(periodId);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const loadPayrollItems = async (periodId: number) => {
    try {
      const response = await payrollService.getPayrollItems({ period_id: periodId });
      if (response.success) {
        setPayrollItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load payroll items:', error);
    }
  };

  const handleCreatePeriod = async () => {
    try {
      const response = await payrollService.createPeriod(newPeriodData);
      if (response.success) {
        toast.success('Payroll period created successfully');
        loadPeriods();
        setNewPeriodData({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          period_number: 1
        });
      }
    } catch (error) {
      toast.error('Failed to create payroll period');
    }
  };

  const handleCalculatePayroll = async () => {
    if (!selectedPeriod) return;
    
    try {
      const response = await payrollService.calculatePayroll({
        period_id: selectedPeriod.id
      });
      
      if (response.success) {
        toast.success(`Processed ${response.data.processed_count} employees`);
        loadSummary(selectedPeriod.id);
        loadPayrollItems(selectedPeriod.id);
      }
    } catch (error) {
      toast.error('Failed to calculate payroll');
    }
  };

  const handleFinalizePeriod = async () => {
    if (!selectedPeriod) return;
    
    try {
      const response = await payrollService.finalizePeriod(selectedPeriod.id);
      if (response.success) {
        toast.success('Payroll period finalized');
        loadPeriods();
      }
    } catch (error) {
      toast.error('Failed to finalize payroll period');
    }
  };

  const handleReopenPeriod = async () => {
    if (!selectedPeriod) return;
    
    try {
      const response = await payrollService.reopenPeriod(selectedPeriod.id);
      if (response.success) {
        toast.success('Payroll period reopened');
        loadPeriods();
      }
    } catch (error) {
      toast.error('Failed to reopen payroll period');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      open: 'default',
      calculating: 'secondary',
      finalized: 'outline',
      locked: 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">
            Manage payroll periods, calculations, and employee payments
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payroll Period</DialogTitle>
                <DialogDescription>
                  Create a new payroll period for processing employee payments.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      value={newPeriodData.year}
                      onChange={(e) => setNewPeriodData({
                        ...newPeriodData,
                        year: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Select
                      value={newPeriodData.month.toString()}
                      onValueChange={(value) => setNewPeriodData({
                        ...newPeriodData,
                        month: parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Period Number</Label>
                  <Select
                    value={newPeriodData.period_number.toString()}
                    onValueChange={(value) => setNewPeriodData({
                      ...newPeriodData,
                      period_number: parseInt(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Half (1-15)</SelectItem>
                      <SelectItem value="2">2nd Half (16-End)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogTrigger>
                <Button onClick={handleCreatePeriod}>Create Period</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="periods">
            <Calendar className="mr-2 h-4 w-4" />
            Periods
          </TabsTrigger>
          <TabsTrigger value="processing">
            <Calculator className="mr-2 h-4 w-4" />
            Processing
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Periods</CardTitle>
              <CardDescription>
                Manage payroll periods and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Employees</TableHead>
                    <TableHead>Net Pay</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow 
                      key={period.id}
                      className={selectedPeriod?.id === period.id ? 'bg-muted' : ''}
                    >
                      <TableCell className="font-medium">
                        Period {period.period_number}
                      </TableCell>
                      <TableCell>{period.year}</TableCell>
                      <TableCell>
                        {new Date(period.year, period.month - 1).toLocaleString('default', { month: 'long' })}
                      </TableCell>
                      <TableCell>
                        {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(period.status)}</TableCell>
                      <TableCell>
                        {period.status === 'open' ? '-' : (summary?.total_employees || '-')}
                      </TableCell>
                      <TableCell>
                        {period.total_net_pay ? formatCurrency(period.total_net_pay) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPeriod(period)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {period.status === 'finalized' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Unlock className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reopen Payroll Period</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will reopen the payroll period for modifications. Are you sure?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleReopenPeriod}>
                                    Reopen
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {selectedPeriod && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary?.total_employees || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Pay</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary ? formatCurrency(summary.total_gross_pay) : '-'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary ? formatCurrency(summary.total_deductions) : '-'}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Pay</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary ? formatCurrency(summary.total_net_pay) : '-'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        Processing: {selectedPeriod.year} - {new Date(selectedPeriod.year, selectedPeriod.month - 1).toLocaleString('default', { month: 'long' })} (Period {selectedPeriod.period_number})
                      </CardTitle>
                      <CardDescription>
                        Status: {getStatusBadge(selectedPeriod.status)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedPeriod.status === 'open' && (
                        <Button onClick={handleCalculatePayroll}>
                          <Play className="mr-2 h-4 w-4" />
                          Calculate Payroll
                        </Button>
                      )}
                      {selectedPeriod.status === 'calculating' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button>
                              <Lock className="mr-2 h-4 w-4" />
                              Finalize Period
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Finalize Payroll Period</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will finalize the payroll period and prevent further modifications. Are you sure?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleFinalizePeriod}>
                                Finalize
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Basic Pay</TableHead>
                        <TableHead>Allowances</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.employee?.full_name}
                          </TableCell>
                          <TableCell>{item.employee?.department}</TableCell>
                          <TableCell>{formatCurrency(item.basic_pay)}</TableCell>
                          <TableCell>{formatCurrency(item.total_allowances)}</TableCell>
                          <TableCell>{formatCurrency(item.total_deductions)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.net_pay)}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {item.status === 'calculated' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => payrollService.approvePayrollItem(item.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Reports</CardTitle>
              <CardDescription>
                Generate and download payroll reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Reports functionality coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Configuration</CardTitle>
              <CardDescription>
                Manage allowance types, deduction types, and employee overrides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Configuration functionality coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}