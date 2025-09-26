import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock,
  UserCheck,
  Hash
} from 'lucide-react';
import type { CompensationBenefit } from '@/types/compensation';
import { BENEFIT_TYPE_LABELS } from '@/types/compensation';
import { compensationService } from '@/services/compensationService';
import { toast } from 'sonner';

interface BenefitRecordDialogProps {
  recordId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BenefitRecordDialog({ recordId, open, onOpenChange }: BenefitRecordDialogProps) {
  const [record, setRecord] = useState<CompensationBenefit | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && recordId) {
      loadRecord();
    }
  }, [open, recordId]);

  const loadRecord = async () => {
    if (!recordId) return;

    try {
      setLoading(true);
      const data = await compensationService.getRecord(recordId);
      setRecord(data);
    } catch (error) {
      console.error('Failed to load record:', error);
      toast.error('Failed to load benefit record details');
    } finally {
      setLoading(false);
    }
  };

  const getBenefitTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'TERMINAL_LEAVE':
        return 'destructive';
      case 'PBB':
        return 'default';
      case 'MID_YEAR_BONUS':
      case 'YEAR_END_BONUS':
        return 'secondary';
      case 'MONETIZATION':
        return 'outline';
      case 'LOYALTY':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Benefit Record Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this compensation benefit record
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : record ? (
          <div className="space-y-6">
            {/* Employee Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  Employee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Employee Name
                    </div>
                    <div className="font-medium text-lg">{record.employee_name}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      Employee Number
                    </div>
                    <div className="font-medium">{record.employee_number}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefit Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Benefit Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Benefit Type</div>
                    <Badge 
                      variant={getBenefitTypeBadgeVariant(record.benefit_type)} 
                      className="text-sm px-3 py-1"
                    >
                      {BENEFIT_TYPE_LABELS[record.benefit_type]}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Amount</div>
                    <div className="text-2xl font-bold text-green-600">
                      {compensationService.formatCurrency(record.amount)}
                    </div>
                  </div>
                </div>

                {record.days_used && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Days Used</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{record.days_used} days</span>
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Notes</div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{record.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Processing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Processed Date
                    </div>
                    <div className="font-medium">
                      {compensationService.formatDate(record.processed_at)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserCheck className="h-4 w-4" />
                      Processed By
                    </div>
                    <div className="font-medium">
                      {record.processed_by_name || 'System'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Record ID */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Record ID: #{record.id}
              </div>
              <div className="text-xs text-muted-foreground">
                Created: {new Date(record.processed_at).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Record not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}