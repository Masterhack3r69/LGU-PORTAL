import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, CheckCircle, MoreHorizontal, Plus } from 'lucide-react';
import benefitsService from '@/services/benefitsService';
import type { BenefitCycle, BenefitItem } from '@/types/benefits';

interface BenefitItemsReviewProps {
  cycle: BenefitCycle;
  onBack: () => void;
  onComplete: () => void;
}

const BenefitItemsReview: React.FC<BenefitItemsReviewProps> = ({
  cycle,
  onBack,
  onComplete
}) => {
  const [benefitItems, setBenefitItems] = useState<BenefitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BenefitItem | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustment_type: 'Increase' as 'Increase' | 'Decrease' | 'Override',
    amount: '',
    reason: '',
    description: ''
  });

  useEffect(() => {
    loadBenefitItems();
  }, [cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBenefitItems = async () => {
    try {
      const response = await benefitsService.getBenefitItems(cycle.id);
      if (response.success) {
        const data = response.data;
        const items = Array.isArray(data) ? data : (data as { items?: BenefitItem[] })?.items || [];
        setBenefitItems(items);
      } else {
        toast.error('Failed to load benefit items');
      }
    } catch (error) {
      console.error('Failed to load benefit items:', error);
      toast.error('Failed to load benefit items');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveItem = async (itemId: number) => {
    try {
      const response = await benefitsService.approveBenefitItem(itemId);
      if (response.success) {
        toast.success('Benefit item approved successfully');
        loadBenefitItems();
      } else {
        toast.error('Failed to approve benefit item');
      }
    } catch (error) {
      console.error('Failed to approve benefit item:', error);
      toast.error('Failed to approve benefit item');
    }
  };

  const handleAddAdjustment = async () => {
    if (!selectedItem) return;

    try {
      const response = await benefitsService.addBenefitAdjustment(selectedItem.id, {
        adjustment_type: adjustmentForm.adjustment_type,
        amount: parseFloat(adjustmentForm.amount),
        reason: adjustmentForm.reason,
        description: adjustmentForm.description
      });

      if (response.success) {
        toast.success('Adjustment added successfully');
        setAdjustmentDialogOpen(false);
        setSelectedItem(null);
        resetAdjustmentForm();
        loadBenefitItems();
      } else {
        toast.error('Failed to add adjustment');
      }
    } catch (error) {
      console.error('Failed to add adjustment:', error);
      toast.error('Failed to add adjustment');
    }
  };

  const openAdjustmentDialog = (item: BenefitItem) => {
    setSelectedItem(item);
    resetAdjustmentForm();
    setAdjustmentDialogOpen(true);
  };

  const resetAdjustmentForm = () => {
    setAdjustmentForm({
      adjustment_type: 'Increase',
      amount: '',
      reason: '',
      description: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'Draft': 'secondary',
      'Calculated': 'default',
      'Approved': 'outline',
      'Paid': 'default',
      'Cancelled': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getApprovedCount = () => {
    return benefitItems.filter(item => item.status === 'Approved').length;
  };

  const getTotalAmount = () => {
    return benefitItems.reduce((sum, item) => sum + item.amount, 0);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading benefit items...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Review Benefit Items
          </CardTitle>
          <CardDescription>
            Review and approve calculated benefit items for {cycle.cycle_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{getApprovedCount()}</div>
                    <div className="text-sm text-muted-foreground">Approved</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{benefitItems.length}</div>
                    <div className="text-sm text-muted-foreground">Total Items</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(getTotalAmount())}</div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="font-medium">Benefit Items</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Employee</th>
                    <th className="text-left p-4 font-medium">Department</th>
                    <th className="text-right p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {benefitItems.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{item.employee?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.employee?.employee_id || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{item.employee?.department || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openAdjustmentDialog(item)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Adjustment
                            </DropdownMenuItem>
                            {item.status === 'Calculated' && (
                              <DropdownMenuItem onClick={() => handleApproveItem(item.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onComplete}>
                Complete Review
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Adjustment</DialogTitle>
            <DialogDescription>
              Add an adjustment to the benefit item for {selectedItem?.employee?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjustment_type">Adjustment Type</Label>
              <select
                id="adjustment_type"
                className="w-full p-2 border rounded-md"
                value={adjustmentForm.adjustment_type}
                onChange={(e) => setAdjustmentForm({
                  ...adjustmentForm,
                  adjustment_type: e.target.value as 'Increase' | 'Decrease' | 'Override'
                })}
              >
                <option value="Increase">Increase</option>
                <option value="Decrease">Decrease</option>
                <option value="Override">Override</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={adjustmentForm.amount}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                value={adjustmentForm.reason}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                placeholder="Reason for adjustment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={adjustmentForm.description}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAdjustmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAdjustment}>
              Add Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BenefitItemsReview;