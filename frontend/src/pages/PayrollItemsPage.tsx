import React, { useState } from 'react';
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

// Types for Payroll Items
interface PayrollItemType {
  id: number;
  code: string;
  name: string;
  description: string;
  category: 'allowance' | 'deduction';
  is_monthly: boolean;
  is_prorated: boolean;
  is_taxable: boolean;
  is_active: boolean;
  default_amount?: number;
  created_at: string;
  updated_at: string;
}

interface CreatePayrollItemForm {
  code: string;
  name: string;
  description: string;
  category: 'allowance' | 'deduction';
  is_monthly: boolean;
  is_prorated: boolean;
  is_taxable: boolean;
  default_amount?: number;
}

// Mock data for development
const mockPayrollItems: PayrollItemType[] = [
  {
    id: 1,
    code: 'TRANS_ALLOW',
    name: 'Transportation Allowance',
    description: 'Monthly transportation allowance for employees',
    category: 'allowance',
    is_monthly: true,
    is_prorated: false,
    is_taxable: false,
    is_active: true,
    default_amount: 1500,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    code: 'MEAL_ALLOW',
    name: 'Meal Allowance',
    description: 'Daily meal allowance based on working days',
    category: 'allowance',
    is_monthly: false,
    is_prorated: true,
    is_taxable: false,
    is_active: true,
    default_amount: 150,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    code: 'GSIS_CONT',
    name: 'GSIS Contribution',
    description: 'Government Service Insurance System contribution',
    category: 'deduction',
    is_monthly: true,
    is_prorated: false,
    is_taxable: false,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 4,
    code: 'PHILHEALTH',
    name: 'PhilHealth Contribution',
    description: 'Philippine Health Insurance Corporation contribution',
    category: 'deduction',
    is_monthly: true,
    is_prorated: false,
    is_taxable: false,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 5,
    code: 'OVERTIME_PAY',
    name: 'Overtime Pay',
    description: 'Additional compensation for overtime work',
    category: 'allowance',
    is_monthly: false,
    is_prorated: true,
    is_taxable: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

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
    category: item?.category || 'allowance',
    is_monthly: item?.is_monthly || false,
    is_prorated: item?.is_prorated || false,
    is_taxable: item?.is_taxable || false,
    default_amount: item?.default_amount || undefined
  });

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    onSave(formData);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFormData({
      code: item?.code || '',
      name: item?.name || '',
      description: item?.description || '',
      category: item?.category || 'allowance',
      is_monthly: item?.is_monthly || false,
      is_prorated: item?.is_prorated || false,
      is_taxable: item?.is_taxable || false,
      default_amount: item?.default_amount || undefined
    });
  };

  React.useEffect(() => {
    if (open) {
      handleReset();
    }
  }, [open, item]);

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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., TRANS_ALLOW"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'allowance' | 'deduction' })}
              >
                <option value="allowance">Allowance</option>
                <option value="deduction">Deduction</option>
              </select>
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
            <Label htmlFor="default_amount">Default Amount (₱)</Label>
            <Input
              id="default_amount"
              type="number"
              value={formData.default_amount || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                default_amount: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              placeholder="Optional default amount"
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
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_taxable" className="text-sm font-normal">
                  Taxable
                  <span className="text-xs text-muted-foreground block">Subject to withholding tax</span>
                </Label>
                <Switch
                  id="is_taxable"
                  checked={formData.is_taxable}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_taxable: checked })}
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

  // State
  const [payrollItems, setPayrollItems] = useState<PayrollItemType[]>(mockPayrollItems);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<PayrollItemType | null>(null);

  // Filtered items based on search and tab
  const filteredItems = payrollItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'allowances') return matchesSearch && item.category === 'allowance';
    if (activeTab === 'deductions') return matchesSearch && item.category === 'deduction';
    if (activeTab === 'active') return matchesSearch && item.is_active;
    if (activeTab === 'inactive') return matchesSearch && !item.is_active;
    
    return matchesSearch;
  });

  // Event handlers
  const handleCreateItem = (formData: CreatePayrollItemForm) => {
    const newItem: PayrollItemType = {
      id: Math.max(...payrollItems.map(i => i.id)) + 1,
      ...formData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setPayrollItems([...payrollItems, newItem]);
    toast.success('Payroll item created successfully');
  };

  const handleEditItem = (item: PayrollItemType) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const handleUpdateItem = (formData: CreatePayrollItemForm) => {
    if (!editingItem) return;
    
    const updatedItems = payrollItems.map(item => 
      item.id === editingItem.id 
        ? { ...item, ...formData, updated_at: new Date().toISOString() }
        : item
    );
    
    setPayrollItems(updatedItems);
    setEditingItem(null);
    toast.success('Payroll item updated successfully');
  };

  const handleToggleActive = (item: PayrollItemType) => {
    const updatedItems = payrollItems.map(i => 
      i.id === item.id ? { ...i, is_active: !i.is_active } : i
    );
    setPayrollItems(updatedItems);
    toast.success(`Payroll item ${item.is_active ? 'deactivated' : 'activated'}`);
  };

  const handleDeleteItem = (item: PayrollItemType) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      setPayrollItems(payrollItems.filter(i => i.id !== item.id));
      toast.success('Payroll item deleted successfully');
    }
  };

  // Get counts for tabs
  const counts = {
    all: payrollItems.length,
    allowances: payrollItems.filter(i => i.category === 'allowance').length,
    deductions: payrollItems.filter(i => i.category === 'deduction').length,
    active: payrollItems.filter(i => i.is_active).length,
    inactive: payrollItems.filter(i => !i.is_active).length
  };

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
            <Button variant="outline" onClick={() => setLoading(!loading)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="allowances" className="flex items-center gap-1">
            <Gift className="h-4 w-4" />
            Allowances ({counts.allowances})
          </TabsTrigger>
          <TabsTrigger value="deductions" className="flex items-center gap-1">
            <Minus className="h-4 w-4" />
            Deductions ({counts.deductions})
          </TabsTrigger>
          <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({counts.inactive})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5" />
                Payroll Items
                <Badge variant="outline" className="ml-2">
                  {filteredItems.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payroll items found.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="hidden md:table-cell">Properties</TableHead>
                        <TableHead className="hidden sm:table-cell">Default Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
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
                            <Badge 
                              className={
                                item.category === 'allowance' 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {item.category === 'allowance' ? (
                                <>
                                  <Gift className="mr-1 h-3 w-3" />
                                  Allowance
                                </>
                              ) : (
                                <>
                                  <Minus className="mr-1 h-3 w-3" />
                                  Deduction
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {item.is_monthly && (
                                <Badge variant="outline" className="text-xs">Monthly</Badge>
                              )}
                              {item.is_prorated && (
                                <Badge variant="outline" className="text-xs">Prorated</Badge>
                              )}
                              {item.is_taxable && (
                                <Badge variant="outline" className="text-xs">Taxable</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {item.default_amount ? `₱${item.default_amount.toLocaleString()}` : '-'}
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
                                <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleActive(item)}>
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
                                  onClick={() => handleDeleteItem(item)}
                                  className="text-red-600"
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