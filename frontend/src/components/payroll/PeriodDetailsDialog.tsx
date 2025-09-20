import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  FileText,
  Eye,
  CheckCircle,
  Info,
  TrendingUp,
  Banknote
} from 'lucide-react';
import type { PayrollPeriod, PayrollSummary } from '@/types/payroll';

interface PeriodDetailsDialogProps {
  period: PayrollPeriod;
  summary?: PayrollSummary | null;
  trigger?: React.ReactNode;
}

export function PeriodDetailsDialog({ period, summary, trigger }: PeriodDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  const formatDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const variants = {
      draft: 'secondary',
      processing: 'default',
      completed: 'default',
      finalized: 'default',
      paid: 'outline',
      open: 'secondary',
      calculating: 'default',
      locked: 'destructive'
    } as const;

    const icons = {
      draft: Clock,
      processing: TrendingUp,
      completed: CheckCircle,
      finalized: CheckCircle,
      paid: Banknote,
      open: Calendar,
      calculating: TrendingUp,
      locked: Info
    };

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

    const variant = variants[statusLower as keyof typeof variants] || 'secondary';
    const Icon = icons[statusLower as keyof typeof icons] || Info;
    const displayName = displayNames[statusLower] || status;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {displayName}
      </Badge>
    );
  };

  const getMonthName = (month: number) => {
    return new Date(2024, month - 1).toLocaleString('default', { month: 'long' });
  };

  const getPeriodDescription = () => {
    if (period.period_number === 1) {
      return `1st to 15th of ${getMonthName(period.month)} ${period.year}`;
    } else {
      return `16th to end of ${getMonthName(period.month)} ${period.year}`;
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payroll Period Details
          </DialogTitle>
          <DialogDescription>
            Detailed information for Period {period.period_number} - {getMonthName(period.month)} {period.year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Period Information
                </CardTitle>
                {getStatusBadge(period.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Period</div>
                  <div className="font-medium">{getPeriodDescription()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Year</div>
                  <div className="font-medium">{period.year}</div>
                </div>
              </div>

              {period.start_date && period.end_date && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Period Dates</div>
                  <div className="font-medium">
                    {formatDate(period.start_date)} - {formatDate(period.end_date)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Created</div>
                  <div className="text-sm">{formatDateTime(period.created_at)}</div>
                </div>
                {period.finalized_at && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground">Finalized</div>
                    <div className="text-sm">{formatDateTime(period.finalized_at)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          {summary && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Employee Count */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Total Employees
                    </div>
                    <div className="text-2xl font-bold">
                      {summary.total_employees || 0}
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Banknote className="h-4 w-4" />
                      Total Net Pay
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary.total_net_pay || 0)}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Basic Pay</div>
                    <div className="font-medium">{formatCurrency(summary.total_basic_pay || 0)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Allowances</div>
                    <div className="font-medium text-green-600">+{formatCurrency(summary.total_allowances || 0)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Deductions</div>
                    <div className="font-medium text-red-600">-{formatCurrency(summary.total_deductions || 0)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Created</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(period.created_at)}</div>
                  </div>
                </div>
                
                {period.finalized_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Finalized</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(period.finalized_at)}</div>
                      {period.finalized_by && (
                        <div className="text-xs text-muted-foreground">By User ID: {period.finalized_by}</div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    period.status.toLowerCase() === 'completed' || period.status.toLowerCase() === 'finalized'
                      ? 'bg-green-500' 
                      : period.status.toLowerCase() === 'processing'
                      ? 'bg-yellow-500'
                      : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Current Status: {period.status}</div>
                    <div className="text-xs text-muted-foreground">Last updated: {formatDateTime(period.updated_at)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}