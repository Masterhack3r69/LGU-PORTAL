// components/tlb/TLBRecordDetails.tsx - TLB Record Details View
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { tlbService } from '@/services/tlbService';
import type { TLBRecord } from '@/types/tlb';
import { Calendar, User, Calculator, DollarSign, FileText, Clock } from 'lucide-react';

interface TLBRecordDetailsProps {
  record: TLBRecord;
  onClose: () => void;
}

export function TLBRecordDetails({ record, onClose }: TLBRecordDetailsProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Computed': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Paid': 'bg-emerald-100 text-emerald-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">TLB Record Details</h3>
          <p className="text-sm text-muted-foreground">
            Record ID: {record.id}
          </p>
        </div>
        <Badge className={getStatusColor(record.status)}>
          {record.status}
        </Badge>
      </div>

      {/* Employee Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Employee Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <p className="text-sm">{record.employee_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employee Number</label>
              <p className="text-sm font-mono">{record.employee_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Position</label>
              <p className="text-sm">{record.plantilla_position}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Appointment Date</label>
              <p className="text-sm">{record.appointment_date ? tlbService.formatDate(record.appointment_date) : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TLB Calculation */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4" />
            TLB Calculation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Leave Credits</label>
              <p className="text-sm font-mono">{record.total_leave_credits} days</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Highest Salary</label>
              <p className="text-sm font-mono">{tlbService.formatCurrency(record.highest_monthly_salary)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Factor</label>
              <p className="text-sm font-mono">{record.constant_factor}</p>
            </div>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Computed Amount</span>
            </div>
            <p className="text-2xl font-bold font-mono text-primary">
              {tlbService.formatCurrency(record.computed_amount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Formula: {record.total_leave_credits} × {tlbService.formatCurrency(record.highest_monthly_salary)} × {record.constant_factor}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Important Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Separation Date</label>
              <p className="text-sm">{tlbService.formatDate(record.separation_date)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Claim Date</label>
              <p className="text-sm">{tlbService.formatDate(record.claim_date)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      {(record.status === 'Paid' || record.check_number || record.payment_date) && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {record.check_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Check Number</label>
                  <p className="text-sm font-mono">{record.check_number}</p>
                </div>
              )}
              {record.payment_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Date</label>
                  <p className="text-sm">{tlbService.formatDate(record.payment_date)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {record.notes && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Processing Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Processing Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Processed By</label>
              <p className="text-sm">{record.processed_by_name || 'System'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created At</label>
              <p className="text-sm">{tlbService.formatDate(record.created_at)}</p>
            </div>
            {record.processed_at && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{tlbService.formatDate(record.processed_at)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}