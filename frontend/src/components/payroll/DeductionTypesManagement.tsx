import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { showToast } from "@/lib/toast"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, Power, PowerOff, MoreHorizontal } from 'lucide-react';
import payrollService from '@/services/payrollService';
import type { DeductionType } from '@/types/payroll.js';

export function DeductionTypesManagement() {
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DeductionType | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    description: string;
    default_amount: string;
    calculation_type: 'Fixed' | 'Percentage' | 'Formula';
    percentage_base: string | undefined;
    is_mandatory: boolean;
    frequency: 'Monthly' | 'Annual' | 'Conditional';
    is_active: boolean;
  }>({
    name: '',
    code: '',
    description: '',
    default_amount: '',
    calculation_type: 'Fixed',
    percentage_base: undefined,
    is_mandatory: false,
    frequency: 'Monthly',
    is_active: true
  });

  useEffect(() => {
    loadDeductionTypes();
  }, []);

  const loadDeductionTypes = async () => {
    try {
      const response = await payrollService.getDeductionTypes();
      if (response.success) {
        // Handle response structure that might be nested
        const data = response.data;
        const deductionTypesData = Array.isArray(data) ? data : (data as { deduction_types?: DeductionType[] })?.deduction_types || [];
        setDeductionTypes(deductionTypesData);
      } else {
        showToast.error('Failed to load deduction types');
      }
    } catch (error) {
      console.error('Failed to load deduction types:', error);
      showToast.error('Failed to load deduction types');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      default_amount: '',
      calculation_type: 'Fixed',
      percentage_base: undefined,
      is_mandatory: false,
      frequency: 'Monthly',
      is_active: true
    });
    setEditingType(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (deductionType: DeductionType) => {
    setFormData({
      name: deductionType.name,
      code: deductionType.code,
      description: deductionType.description || '',
      default_amount: deductionType.default_amount?.toString() || '',
      calculation_type: deductionType.calculation_type,
      percentage_base: deductionType.percentage_base || undefined,
      is_mandatory: deductionType.is_mandatory,
      frequency: deductionType.frequency,
      is_active: deductionType.is_active
    });
    setEditingType(deductionType);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const submitData: Partial<DeductionType> = {
        ...formData,
        default_amount: formData.default_amount ? parseFloat(formData.default_amount) : undefined,
        percentage_base: formData.calculation_type === 'Percentage' ? (formData.percentage_base as 'BasicPay' | 'MonthlySalary' | 'GrossPay' | undefined) : undefined
      };

      let response;
      if (editingType) {
        response = await payrollService.updateDeductionType(editingType.id, submitData);
      } else {
        response = await payrollService.createDeductionType(submitData);
      }

      if (response.success) {
        showToast.success(editingType ? 'Deduction type updated successfully' : 'Deduction type created successfully');
        setDialogOpen(false);
        resetForm();
        loadDeductionTypes();
      } else {
        showToast.error('Failed to save deduction type');
      }
    } catch (error) {
      console.error('Failed to save deduction type:', error);
      showToast.error('Failed to save deduction type');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await payrollService.deleteDeductionType(id);
      if (response.success) {
        showToast.success('Deduction type deleted successfully');
        loadDeductionTypes();
      } else {
        showToast.error('Failed to delete deduction type');
      }
    } catch (error) {
      console.error('Failed to delete deduction type:', error);
      showToast.error('Failed to delete deduction type');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await payrollService.toggleDeductionType(id);
      if (response.success) {
        showToast.success('Deduction type status updated successfully');
        loadDeductionTypes();
      } else {
        showToast.error('Failed to update deduction type status');
      }
    } catch (error) {
      console.error('Failed to toggle deduction type:', error);
      showToast.error('Failed to update deduction type status');
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading deduction types...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deduction Types</CardTitle>
            <CardDescription>
              Manage deduction types that can be applied to employee payrolls
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Deduction Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name / Code</TableHead>
              <TableHead>Calculation</TableHead>
              <TableHead>Default Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mandatory</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deductionTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-sm text-muted-foreground">{type.code}</div>
                    {type.description && (
                      <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <Badge variant="outline">{type.calculation_type}</Badge>
                    {type.percentage_base && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Base: {type.percentage_base}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(type.default_amount)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{type.frequency}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={type.is_active ? 'default' : 'secondary'}>
                    {type.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={type.is_mandatory ? 'destructive' : 'outline'}>
                    {type.is_mandatory ? 'Mandatory' : 'Optional'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openEditDialog(type)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleActive(type.id)}>
                        {type.is_active ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <AlertDialog>
                          <AlertDialogTrigger className="flex items-center w-full cursor-pointer px-2 py-1.5 text-sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Deduction Type</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{type.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(type.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Edit Deduction Type' : 'Create Deduction Type'}
              </DialogTitle>
              <DialogDescription>
                {editingType 
                  ? 'Update the deduction type details below.'
                  : 'Add a new deduction type that can be applied to employee payrolls.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Income Tax"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="ITAX"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this deduction type"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calculation_type">Calculation Type</Label>
                  <Select
                    value={formData.calculation_type}
                    onValueChange={(value: 'Fixed' | 'Percentage' | 'Formula') => setFormData({ 
                      ...formData, 
                      calculation_type: value,
                      percentage_base: value === 'Percentage' ? 'BasicPay' : undefined
                    })}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed">Fixed Amount</SelectItem>
                      <SelectItem value="Percentage">Percentage</SelectItem>
                      <SelectItem value="Formula">Formula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: 'Monthly' | 'Annual' | 'Conditional') => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="Conditional">Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.calculation_type === 'Percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="percentage_base">Percentage Base</Label>
                  <Select
                    value={formData.percentage_base || ''}
                    onValueChange={(value) => setFormData({ ...formData, percentage_base: value })}
                  >
                    <SelectTrigger className='w-full' >
                      <SelectValue placeholder="Select percentage base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BasicPay">Basic Pay</SelectItem>
                      <SelectItem value="MonthlySalary">Monthly Salary</SelectItem>
                      <SelectItem value="GrossPay">Gross Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="default_amount">Default Amount</Label>
                <Input
                  id="default_amount"
                  type="number"
                  step="0.01"
                  value={formData.default_amount}
                  onChange={(e) => setFormData({ ...formData, default_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              </div>

              

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_mandatory"
                    checked={formData.is_mandatory}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
                  />
                  <Label htmlFor="is_mandatory">Mandatory</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingType ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}