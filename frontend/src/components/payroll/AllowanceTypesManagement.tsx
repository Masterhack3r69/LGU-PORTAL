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
import { toast } from 'sonner';
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
import type { AllowanceType } from '@/types/payroll';

export function AllowanceTypesManagement() {
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AllowanceType | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    description: string;
    default_amount: string;
    calculation_type: 'Fixed' | 'Percentage' | 'Formula';
    percentage_base: string | undefined;
    is_taxable: boolean;
    frequency: 'Monthly' | 'Annual' | 'Conditional';
    is_active: boolean;
  }>({
    name: '',
    code: '',
    description: '',
    default_amount: '',
    calculation_type: 'Fixed' as const,
    percentage_base: undefined as string | undefined,
    is_taxable: false,
    frequency: 'Monthly' as const,
    is_active: true
  });

  useEffect(() => {
    loadAllowanceTypes();
  }, []);

  const loadAllowanceTypes = async () => {
    try {
      const response = await payrollService.getAllowanceTypes();
      if (response.success) {
        // Handle response structure that might be nested
        const data = response.data;
        const allowanceTypesData = Array.isArray(data) ? data : (data as { allowance_types?: AllowanceType[] })?.allowance_types || [];
        setAllowanceTypes(allowanceTypesData);
      } else {
        toast.error('Failed to load allowance types');
      }
    } catch (error) {
      console.error('Failed to load allowance types:', error);
      toast.error('Failed to load allowance types');
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
      is_taxable: false,
      frequency: 'Monthly',
      is_active: true
    });
    setEditingType(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (allowanceType: AllowanceType) => {
    setFormData({
      name: allowanceType.name,
      code: allowanceType.code,
      description: allowanceType.description || '',
      default_amount: allowanceType.default_amount?.toString() || '',
      calculation_type: allowanceType.calculation_type,
      percentage_base: allowanceType.percentage_base || undefined,
      is_taxable: allowanceType.is_taxable,
      frequency: allowanceType.frequency,
      is_active: allowanceType.is_active
    });
    setEditingType(allowanceType);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const submitData: Partial<AllowanceType> = {
        ...formData,
        default_amount: formData.default_amount ? parseFloat(formData.default_amount) : undefined,
        percentage_base: formData.calculation_type === 'Percentage' ? (formData.percentage_base as 'BasicPay' | 'MonthlySalary' | 'GrossPay' | undefined) : undefined
      };

      let response;
      if (editingType) {
        response = await payrollService.updateAllowanceType(editingType.id, submitData);
      } else {
        response = await payrollService.createAllowanceType(submitData);
      }

      if (response.success) {
        toast.success(editingType ? 'Allowance type updated successfully' : 'Allowance type created successfully');
        setDialogOpen(false);
        resetForm();
        loadAllowanceTypes();
      } else {
        toast.error('Failed to save allowance type');
      }
    } catch (error) {
      console.error('Failed to save allowance type:', error);
      toast.error('Failed to save allowance type');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await payrollService.deleteAllowanceType(id);
      if (response.success) {
        toast.success('Allowance type deleted successfully');
        loadAllowanceTypes();
      } else {
        toast.error('Failed to delete allowance type');
      }
    } catch (error) {
      console.error('Failed to delete allowance type:', error);
      toast.error('Failed to delete allowance type');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await payrollService.toggleAllowanceType(id);
      if (response.success) {
        toast.success('Allowance type status updated successfully');
        loadAllowanceTypes();
      } else {
        toast.error('Failed to update allowance type status');
      }
    } catch (error) {
      console.error('Failed to toggle allowance type:', error);
      toast.error('Failed to update allowance type status');
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
    return <div className="flex items-center justify-center p-8">Loading allowance types...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Allowance Types</CardTitle>
            <CardDescription>
              Manage allowance types that can be applied to employee payrolls
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Allowance Type
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
              <TableHead>Taxable</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allowanceTypes.map((type) => (
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
                  <Badge variant={type.is_taxable ? 'destructive' : 'outline'}>
                    {type.is_taxable ? 'Taxable' : 'Non-taxable'}
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
                              <AlertDialogTitle>Delete Allowance Type</AlertDialogTitle>
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
                {editingType ? 'Edit Allowance Type' : 'Create Allowance Type'}
              </DialogTitle>
              <DialogDescription>
                {editingType 
                  ? 'Update the allowance type details below.'
                  : 'Add a new allowance type that can be applied to employee payrolls.'
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
                    placeholder="Transportation Allowance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="TRANS"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this allowance type"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    <SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="Conditional">Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.calculation_type === 'Percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="percentage_base">Percentage Base</Label>
                  <Select
                    value={formData.percentage_base || ''}
                    onValueChange={(value) => setFormData({ ...formData, percentage_base: value })}
                  >
                    <SelectTrigger>
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_taxable"
                    checked={formData.is_taxable}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_taxable: checked })}
                  />
                  <Label htmlFor="is_taxable">Taxable</Label>
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