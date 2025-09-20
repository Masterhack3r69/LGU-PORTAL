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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Edit, Clock } from 'lucide-react';
import payrollService from '@/services/payrollService';
import type { PayrollItem } from '@/types/payroll';

interface WorkingDaysAdjustmentDialogProps {
  payrollItem: PayrollItem;
  onAdjustmentComplete: (updatedItem: PayrollItem) => void;
  trigger?: React.ReactNode;
}

export function WorkingDaysAdjustmentDialog({
  payrollItem,
  onAdjustmentComplete,
  trigger
}: WorkingDaysAdjustmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workingDays: payrollItem.working_days?.toString() || '22',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const workingDays = parseFloat(formData.workingDays);
    if (isNaN(workingDays) || workingDays < 0 || workingDays > 31) {
      toast.error('Please enter a valid number of working days (0-31)');
      return;
    }

    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    setLoading(true);

    try {
      const response = await payrollService.adjustWorkingDays(
        payrollItem.id,
        workingDays,
        formData.reason
      );

      if (response.success) {
        toast.success('Working days adjusted successfully');
        onAdjustmentComplete(response.data);
        setOpen(false);
        setFormData({
          workingDays: '',
          reason: ''
        });
      } else {
        toast.error(response.message || 'Failed to adjust working days');
      }
    } catch (error) {
      console.error('Failed to adjust working days:', error);
      toast.error('Failed to adjust working days');
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button size="sm" variant="outline">
      <Edit className="mr-2 h-4 w-4" />
      Adjust Working Days
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Adjust Working Days
          </DialogTitle>
          <DialogDescription>
            Adjust the working days for {payrollItem.employee?.full_name || 'this employee'}.
            This will recalculate the payroll automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Information */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="text-sm font-medium">Current Information</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Employee:</span>
                <div className="font-medium">{payrollItem.employee?.full_name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Current Working Days:</span>
                <div className="font-medium">{payrollItem.working_days || 22} days</div>
              </div>
            </div>
          </div>

          {/* Working Days Input */}
          <div className="space-y-2">
            <Label htmlFor="workingDays">New Working Days *</Label>
            <Input
              id="workingDays"
              type="number"
              min="0"
              max="31"
              step="0.5"
              value={formData.workingDays}
              onChange={(e) => setFormData({ ...formData, workingDays: e.target.value })}
              placeholder="Enter working days (0-31)"
              required
            />
            <div className="text-xs text-muted-foreground">
              Enter the number of working days (can include half days, e.g., 22.5)
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Explain why the working days are being adjusted..."
              rows={3}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adjusting...' : 'Adjust Working Days'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}