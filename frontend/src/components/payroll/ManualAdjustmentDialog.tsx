import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import payrollService from '@/services/payrollService';
import type { PayrollItem } from '@/types/payroll';

interface ManualAdjustmentDialogProps {
  payrollItem: PayrollItem;
  onAdjustmentAdded: (updatedItem: PayrollItem) => void;
  trigger?: React.ReactNode;
}

export function ManualAdjustmentDialog({ payrollItem, onAdjustmentAdded, trigger }: ManualAdjustmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    adjustmentType: '' as 'Allowance' | 'Deduction' | 'Adjustment' | '',
    description: '',
    amount: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.adjustmentType || !formData.description || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount === 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const response = await payrollService.addManualAdjustment(
        payrollItem.id,
        formData.adjustmentType as 'Allowance' | 'Deduction' | 'Adjustment',
        formData.description,
        amount,
        formData.reason
      );

      if (response.success) {
        toast.success('Manual adjustment added successfully');
        onAdjustmentAdded(response.data);
        setOpen(false);
        setFormData({
          adjustmentType: '',
          description: '',
          amount: '',
          reason: ''
        });
      } else {
        toast.error(response.message || 'Failed to add manual adjustment');
      }
    } catch (error) {
      console.error('Failed to add manual adjustment:', error);
      toast.error('Failed to add manual adjustment');
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button size="sm">
      <Plus className="mr-2 h-4 w-4" />
      Add Adjustment
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Manual Adjustment</DialogTitle>
          <DialogDescription>
            Add a manual allowance, deduction, or adjustment to this payroll item.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adjustmentType">Adjustment Type *</Label>
            <Select
              value={formData.adjustmentType}
              onValueChange={(value) => setFormData({ ...formData, adjustmentType: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select adjustment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Allowance">Allowance</SelectItem>
                <SelectItem value="Deduction">Deduction</SelectItem>
                <SelectItem value="Adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter adjustment description"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Optional reason for this adjustment"
              rows={3}
            />
          </div>

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
              {loading ? 'Adding...' : 'Add Adjustment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}