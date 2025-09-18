import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, Plus, Search, Edit, Trash2, AlertCircle, RefreshCw, 
  Settings, Gift, Minus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { payrollItemsService } from '@/services/payrollItemsService';
import { payrollDeductionTypesService } from '@/services/payrollDeductionTypesService';
import type { PayrollItemType, CreatePayrollItemForm } from '@/services/payrollItemsService';
import type { PayrollDeductionType } from '@/services/payrollDeductionTypesService';

// Note: Types are now imported from the service

// Mock data removed - now using real API

// Component for Create/Edit Dialog
function PayrollItemDialog({ 
  item, 
  open, 
  onOpenChange, 
  onSave 
}: {
  item?: PayrollItemType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: CreatePayrollItemForm) => void;
}) {
  const [formData, setFormData] = useState<CreatePayrollItemForm>({
    code: item?.code || '',
    name: item?.name || '',
    description: item?.description || '',
    amount: item?.amount || 0,
    is_monthly: item?.is_monthly || false,
    is_prorated: item?.is_prorated || false
  });

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    onSave(formData);
    onOpenChange(false);
  };

  const handleReset = useCallback(() => {
    setFormData({
      code: item?.code || '',
      name: item?.name || '',
      description: item?.description || '',
      amount: item?.amount || 0,
      is_monthly: item?.is_monthly || false,
      is_prorated: item?.is_prorated || false
    });
  }, [item]);

  React.useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [open, item, handleReset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Payroll Item' : 'Create New Payroll Item'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update the payroll item information' : 'Define a new payroll allowance or deduction item'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., TRANS_ALLOW"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Transportation Allowance"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this payroll item"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₱)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                amount: e.target.value ? parseFloat(e.target.value) : 0
              })}
              placeholder="Enter allowance amount"
            />
          </div>
          
          <div className="space-y-4">
            <Label>Configuration Options</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_monthly" className="text-sm font-normal">
                  Monthly Item
                  <span className="text-xs text-muted-foreground block">Applied once per month</span>
                </Label>
                <Switch
                  id="is_monthly"
                  checked={formData.is_monthly}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_monthly: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_prorated" className="text-sm font-normal">
                  Prorated
                  <span className="text-xs text-muted-foreground block">Calculate based on working days</span>
                </Label>
                <Switch
                  id="is_prorated"
                  checked={formData.is_prorated}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_prorated: checked })}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {item ? 'Update Item' : 'Create Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const PayrollItemsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State for both allowances and deductions
  const [payrollItems, setPayrollItems] = useState<PayrollItemType[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<PayrollDeductionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('allowances');
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<PayrollItemType | null>(null);
  // const [editingDeduction, setEditingDeduction] = useState<PayrollDeductionType | null>(null);
  // const [dialogType, setDialogType] = useState<'allowance' | 'deduction'>('allowance');

  // Load both allowances and deductions from API
  const loadPayrollItems = useCallback(async () => {
    try {
      setLoading(true);
      const [allowancesResponse, deductionsResponse] = await Promise.all([
        payrollItemsService.getPayrollItems({
          search: searchTerm || undefined
        }),
        payrollDeductionTypesService.getPayrollDeductions({
          search: searchTerm || undefined
        })
      ]);
      
      if (allowancesResponse.success) {
        setPayrollItems(allowancesResponse.data);
      } else {
        toast.error(allowancesResponse.message || 'Failed to load allowance types');
      }
      
      if (deductionsResponse.success) {
        setDeductionTypes(deductionsResponse.data);
      } else {
        toast.error(deductionsResponse.message || 'Failed to load deduction types');
      }
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // Load data on component mount
  useEffect(() => {
    loadPayrollItems();
  }, [loadPayrollItems]);

  // Filtered items based on search and tab
  const filteredAllowances = payrollItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  
  const filteredDeductions = deductionTypes.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Event handlers
  const handleCreateItem = async (formData: CreatePayrollItemForm) => {
    try {
      setLoading(true);
      const response = await payrollItemsService.createPayrollItem(formData);
      
      if (response.success) {
        await loadPayrollItems(); // Reload the list
        toast.success('Payroll item created successfully');
      } else {
        toast.error(response.message || 'Failed to create payroll item');
      }
    } catch (error) {
      console.error('Error creating payroll item:', error);
      toast.error('Failed to create payroll item');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item: PayrollItemType) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const handleUpdateItem = async (formData: CreatePayrollItemForm) => {
    if (!editingItem) return;
    
    try {
      setLoading(true);
      const response = await payrollItemsService.updatePayrollItem(editingItem.id, formData);
      
      if (response.success) {
        await loadPayrollItems(); // Reload the list
        setEditingItem(null);
        toast.success('Payroll item updated successfully');
      } else {
        toast.error(response.message || 'Failed to update payroll item');
      }
    } catch (error) {
      console.error('Error updating payroll item:', error);
      toast.error('Failed to update payroll item');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (item: PayrollItemType) => {
    try {
      setLoading(true);
      const response = await payrollItemsService.togglePayrollItemStatus(item.id);
      
      if (response.success) {
        await loadPayrollItems(); // Reload the list
        toast.success(`Payroll item ${item.is_active ? 'deactivated' : 'activated'}`);
      } else {
        toast.error(response.message || 'Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item: PayrollItemType) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await payrollItemsService.deletePayrollItem(item.id);
      
      if (response.success) {
        await loadPayrollItems(); // Reload the list
        toast.success('Payroll item deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete payroll item');
      }
    } catch (error) {
      console.error('Error deleting payroll item:', error);
      toast.error('Failed to delete payroll item');
    } finally {
      setLoading(false);
    }
  };

  // Event handlers for deductions - removed unused functions

  const handleToggleDeductionActive = async (deduction: PayrollDeductionType) => {
    try {
      setLoading(true);
      const response = await payrollDeductionTypesService.togglePayrollDeductionStatus(deduction.id);
      
      if (response.success) {
        await loadPayrollItems();
        toast.success(`Deduction type ${deduction.is_active ? 'deactivated' : 'activated'}`);
      } else {
        toast.error(response.message || 'Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling deduction status:', error);
      toast.error('Failed to toggle status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeduction = async (deduction: PayrollDeductionType) => {
    if (deduction.is_government) {
      toast.error('Cannot delete government deduction types');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${deduction.name}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await payrollDeductionTypesService.deletePayrollDeduction(deduction.id);
      
      if (response.success) {
        await loadPayrollItems();
        toast.success('Deduction type deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete deduction type');
      }
    } catch (error) {
      console.error('Error deleting deduction type:', error);
      toast.error('Failed to delete deduction type');
    } finally {
      setLoading(false);
    }
  };

  // Get counts for tabs
  const counts = {
    allowances: payrollItems.length,
    deductions: deductionTypes.length,
    active_allowances: payrollItems.filter(i => i.is_active).length,
    active_deductions: deductionTypes.filter(i => i.is_active).length
  };

  // Get current filtered data based on active tab
  const currentFilteredItems = activeTab === 'allowances' ? filteredAllowances : filteredDeductions;
  // Component content

  // Access control
  if (!isAdmin) {
    return (
      <div className="container mx-auto space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Administrator privileges required to manage payroll items.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Payroll Items Management
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage allowances, deductions, and other payroll components
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setEditingItem(null);
                setShowDialog(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payroll items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={loadPayrollItems} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="allowances" className="flex items-center gap-1">
            <Gift className="h-4 w-4" />
            Allowances ({counts.allowances})
          </TabsTrigger>
          <TabsTrigger value="deductions" className="flex items-center gap-1">
            <Minus className="h-4 w-4" />
            Deductions ({counts.deductions})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                {activeTab === 'allowances' ? (
                  <><Gift className="mr-2 h-5 w-5" />Payroll Allowances</>
                ) : (
                  <><Minus className="mr-2 h-5 w-5" />Payroll Deductions</>
                )}
                <Badge variant="outline" className="ml-2">
                  {currentFilteredItems.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentFilteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No {activeTab} found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="hidden md:table-cell">
                          {activeTab === 'allowances' ? 'Properties' : 'Rate/Amount'}
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentFilteredItems.map((item: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">
                            {item.code}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-muted-foreground md:hidden">
                                {item.description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {activeTab === 'allowances' ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Gift className="mr-1 h-3 w-3" />
                                Allowance
                              </Badge>
                            ) : (
                              <Badge className={item.is_government ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
                                <Minus className="mr-1 h-3 w-3" />
                                {item.is_government ? 'Government' : 'Custom'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {activeTab === 'allowances' ? (
                              <div className="flex flex-wrap gap-1">
                                {item.is_monthly && (
                                  <Badge variant="outline" className="text-xs">Monthly</Badge>
                                )}
                                {item.is_prorated && (
                                  <Badge variant="outline" className="text-xs">Prorated</Badge>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.deduction_type === 'percentage' ? `${item.percentage}%` : 'Fixed'}
                                </Badge>
                                {item.is_mandatory && (
                                  <Badge variant="outline" className="text-xs">Mandatory</Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {activeTab === 'allowances' ? (
                              `₱${item.amount?.toLocaleString()}`
                            ) : (
                              item.deduction_type === 'percentage' 
                                ? `${item.percentage}%${item.max_amount ? ` (max ₱${item.max_amount.toLocaleString()})` : ''}` 
                                : `₱${item.amount?.toLocaleString()}`
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                item.is_active 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {item.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => activeTab === 'allowances' ? handleEditItem(item) : undefined}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => activeTab === 'allowances' ? handleToggleActive(item) : handleToggleDeductionActive(item)}>
                                  {item.is_active ? (
                                    <>
                                      <Minus className="mr-2 h-4 w-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="mr-2 h-4 w-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => activeTab === 'allowances' ? handleDeleteItem(item) : handleDeleteDeduction(item)}
                                  className="text-red-600"
                                  disabled={activeTab === 'deductions' && item.is_government}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <PayrollItemDialog
        item={editingItem}
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditingItem(null);
        }}
        onSave={editingItem ? handleUpdateItem : handleCreateItem}
      />
    </div>
  );
};