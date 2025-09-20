import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Plus,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  Users
} from 'lucide-react';
import payrollService from '@/services/payrollService';
import { PeriodDetailsDialog } from '@/components/payroll/PeriodDetailsDialog';
import type { PayrollPeriod, PayrollSummary } from '@/types/payroll';

export function PayrollPeriodsPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newPeriodData, setNewPeriodData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    period_number: 1
  });

  useEffect(() => {
    loadPeriods();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadSummary(selectedPeriod.id);
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const response = await payrollService.getPeriods();
      if (response.success) {
        // Handle paginated response structure
        const responseData = response.data as { periods?: PayrollPeriod[] } | PayrollPeriod[];
        const periodsData = Array.isArray(responseData) ? responseData : responseData.periods || [];
        setPeriods(Array.isArray(periodsData) ? periodsData : []);
        if (periodsData.length > 0 && !selectedPeriod) {
          setSelectedPeriod(periodsData[0]);
        }
      } else {
        toast.error('Failed to load payroll periods');
      }
    } catch (error) {
      console.error('Failed to load payroll periods:', error);
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

  const handleCreatePeriod = async () => {
    try {
      // Calculate start and end dates based on period
      const { year, month, period_number } = newPeriodData;
      const daysInMonth = new Date(year, month, 0).getDate();

      let start_date, end_date, pay_date;

      if (period_number === 1) {
        // 1st half: 1st to 15th
        start_date = `${year}-${month.toString().padStart(2, '0')}-01`;
        end_date = `${year}-${month.toString().padStart(2, '0')}-15`;
        pay_date = `${year}-${month.toString().padStart(2, '0')}-20`; // Pay on 20th
      } else {
        // 2nd half: 16th to end of month
        start_date = `${year}-${month.toString().padStart(2, '0')}-16`;
        end_date = `${year}-${month.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;

        // Pay date is 5th of next month
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        pay_date = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-05`;
      }

      const periodData = {
        ...newPeriodData,
        start_date,
        end_date,
        pay_date
      };

      const response = await payrollService.createPeriod(periodData);
      if (response.success) {
        toast.success('Payroll period created successfully');
        loadPeriods();
        setNewPeriodData({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          period_number: 1
        });
      } else {
        toast.error('Failed to create payroll period');
      }
    } catch (error) {
      console.error('Failed to create payroll period:', error);
      toast.error('Failed to create payroll period');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants = {
      draft: 'secondary',
      processing: 'default',
      completed: 'outline', // Use outline for completed status
      finalized: 'outline',
      paid: 'destructive',
      open: 'secondary',
      calculating: 'default',
      locked: 'destructive'
    } as const;

    // Map status display names
    const displayNames: { [key: string]: string } = {
      draft: 'Draft',
      processing: 'Processing',
      completed: 'Completed',
      finalized: 'Finalized',
      paid: 'Paid',
      open: 'Open',
      calculating: 'Calculating',
      locked: 'Locked'
    };

    const displayName = displayNames[statusLower] || status;
    const variant = variants[statusLower as keyof typeof variants] || 'default';

    return <Badge variant={variant}>{displayName}</Badge>;
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payroll Periods</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage payroll periods and their status
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
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

                {/* Preview of calculated dates */}
                <div className="space-y-2">
                  <Label>Calculated Period Dates</Label>
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    {(() => {
                      const { year, month, period_number } = newPeriodData;
                      const daysInMonth = new Date(year, month, 0).getDate();

                      if (period_number === 1) {
                        const pay_date = `${year}-${month.toString().padStart(2, '0')}-20`;
                        return (
                          <div>
                            <div><strong>Period:</strong> 1st to 15th of {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })} {year}</div>
                            <div><strong>Pay Date:</strong> {new Date(pay_date).toLocaleDateString()}</div>
                          </div>
                        );
                      } else {
                        const nextMonth = month === 12 ? 1 : month + 1;
                        const nextYear = month === 12 ? year + 1 : year;
                        const pay_date = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-05`;
                        return (
                          <div>
                            <div><strong>Period:</strong> 16th to {daysInMonth}th of {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })} {year}</div>
                            <div><strong>Pay Date:</strong> {new Date(pay_date).toLocaleDateString()}</div>
                          </div>
                        );
                      }
                    })()}
                  </div>
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Periods
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periods.length}</div>
            <p className="text-xs text-muted-foreground">
              all payroll periods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Periods
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {periods.filter(period =>
                ['draft', 'open', 'processing', 'calculating'].includes(period.status?.toLowerCase() || '')
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Finalized Periods
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {periods.filter(period =>
                ['finalized', 'paid'].includes(period.status?.toLowerCase() || '')
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              completed processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary?.total_employees || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              in current period
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Periods</CardTitle>
          <CardDescription>
            Manage payroll periods and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="block md:hidden space-y-4">
            {periods.map((period) => (
              <Card key={period.id} className={`p-4 ${selectedPeriod?.id === period.id ? 'ring-2 ring-primary' : ''}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      Period {period.period_number} - {period.year}
                    </div>
                    {getStatusBadge(period.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Month:</span>
                      <div>{new Date(period.year, period.month - 1).toLocaleString('default', { month: 'long' })}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Employees:</span>
                      <div>{period.status?.toLowerCase() === 'draft' ? '-' : (summary?.total_employees || '-')}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Dates:</span>
                      <div>
                        {period.start_date && period.end_date
                          ? `${formatDate(period.start_date)} - ${formatDate(period.end_date)}`
                          : 'Not set'
                        }
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Net Pay:</span>
                      <div className="font-medium">
                        {period.total_net_pay ? formatCurrency(period.total_net_pay) : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <div className="flex-1">
                      <PeriodDetailsDialog
                        period={period}
                        summary={selectedPeriod?.id === period.id ? summary : null}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedPeriod(period)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
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
                      {period.start_date && period.end_date
                        ? `${formatDate(period.start_date)} - ${formatDate(period.end_date)}`
                        : 'Not set'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(period.status)}</TableCell>
                    <TableCell>
                      {period.status?.toLowerCase() === 'draft' ? '-' : (summary?.total_employees || '-')}
                    </TableCell>
                    <TableCell>
                      {period.total_net_pay ? formatCurrency(period.total_net_pay) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <PeriodDetailsDialog
                          period={period}
                          summary={selectedPeriod?.id === period.id ? summary : null}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPeriod(period)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}