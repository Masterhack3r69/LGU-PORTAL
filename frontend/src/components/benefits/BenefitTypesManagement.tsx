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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, Power, PowerOff, MoreHorizontal, Info, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import benefitsService from '@/services/benefitsService';
import type { BenefitType, BENEFIT_CATEGORIES } from '@/types/benefits';

const BenefitTypesManagement: React.FC = () => {
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<BenefitType | null>(null);
  const [formulaHelpOpen, setFormulaHelpOpen] = useState(false);

  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    category: 'ANNUAL' | 'PERFORMANCE' | 'LOYALTY' | 'TERMINAL' | 'SPECIAL';
    calculation_type: 'Formula' | 'Fixed' | 'Manual';
    calculation_formula: string;
    default_amount: string;
    is_prorated: boolean;
    minimum_service_months: string;
    is_recurring: boolean;
    is_active: boolean;
    description: string;
  }>({
    code: '',
    name: '',
    category: 'ANNUAL',
    calculation_type: 'Formula',
    calculation_formula: '',
    default_amount: '',
    is_prorated: false,
    minimum_service_months: '',
    is_recurring: true,
    is_active: true,
    description: ''
  });

  useEffect(() => {
    loadBenefitTypes();
  }, []);

  const loadBenefitTypes = async () => {
    try {
      const response = await benefitsService.getBenefitTypes();
      if (response.success) {
        const data = response.data;
        const benefitTypesData = Array.isArray(data) ? data : (data as { benefit_types?: BenefitType[] })?.benefit_types || [];
        setBenefitTypes(benefitTypesData);
      } else {
        toast.error('Failed to load benefit types');
      }
    } catch (error) {
      console.error('Failed to load benefit types:', error);
      toast.error('Failed to load benefit types');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: 'ANNUAL',
      calculation_type: 'Formula',
      calculation_formula: '',
      default_amount: '',
      is_prorated: false,
      minimum_service_months: '',
      is_recurring: true,
      is_active: true,
      description: ''
    });
    setEditingType(null);
  };

  const insertFormula = (formula: string) => {
    setFormData({ ...formData, calculation_formula: formula });
    toast.success('Formula inserted!');
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (benefitType: BenefitType) => {
    setFormData({
      code: benefitType.code,
      name: benefitType.name,
      category: benefitType.category as 'ANNUAL' | 'PERFORMANCE' | 'LOYALTY' | 'TERMINAL' | 'SPECIAL',
      calculation_type: benefitType.calculation_type,
      calculation_formula: benefitType.calculation_formula || '',
      default_amount: benefitType.default_amount?.toString() || '',
      is_prorated: benefitType.is_prorated ?? false,
      minimum_service_months: benefitType.minimum_service_months?.toString() || '',
      is_recurring: benefitType.is_recurring ?? true,
      is_active: benefitType.is_active ?? true,
      description: benefitType.description || ''
    });
    setEditingType(benefitType);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      // Clean and validate form data before submission
      const submitData: Partial<BenefitType> = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        category: formData.category,
        calculation_type: formData.calculation_type,
        is_prorated: formData.is_prorated,
        is_active: formData.is_active,
        description: formData.description?.trim() || undefined
      };

      // Only include calculation_formula for Formula type
      if (formData.calculation_type === 'Formula') {
        if (!formData.calculation_formula?.trim()) {
          toast.error('Calculation formula is required for Formula type');
          return;
        }
        submitData.calculation_formula = formData.calculation_formula.trim();
      }

      // Only include default_amount if provided and valid
      if (formData.default_amount && formData.default_amount.trim()) {
        const amount = parseFloat(formData.default_amount);
        if (isNaN(amount)) {
          toast.error('Default amount must be a valid number');
          return;
        }
        submitData.default_amount = amount;
      }

      // Only include minimum_service_months if provided and valid
      if (formData.minimum_service_months && formData.minimum_service_months.trim()) {
        const months = parseInt(formData.minimum_service_months);
        if (isNaN(months) || months < 0) {
          toast.error('Minimum service months must be a valid positive number');
          return;
        }
        submitData.minimum_service_months = months;
      }

      console.log('Submitting benefit type data:', submitData);

      let response;
      if (editingType) {
        response = await benefitsService.updateBenefitType(editingType.id, submitData);
      } else {
        response = await benefitsService.createBenefitType(submitData);
      }

      if (response.success) {
        toast.success(editingType ? 'Benefit type updated successfully' : 'Benefit type created successfully');
        setDialogOpen(false);
        resetForm();
        loadBenefitTypes();
      } else {
        console.error('API error response:', response);
        toast.error(`Failed to save benefit type: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save benefit type:', error);
      toast.error('Failed to save benefit type: Network or server error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await benefitsService.deleteBenefitType(id);
      if (response.success) {
        toast.success('Benefit type deleted successfully');
        loadBenefitTypes();
      } else {
        toast.error('Failed to delete benefit type');
      }
    } catch (error) {
      console.error('Failed to delete benefit type:', error);
      toast.error('Failed to delete benefit type');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      const response = await benefitsService.toggleBenefitType(id);
      if (response.success) {
        toast.success('Benefit type status updated successfully');
        loadBenefitTypes();
      } else {
        toast.error('Failed to update benefit type status');
      }
    } catch (error) {
      console.error('Failed to toggle benefit type:', error);
      toast.error('Failed to update benefit type status');
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getCategoryBadgeVariant = (category: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'ANNUAL': 'default',
      'PERFORMANCE': 'secondary',
      'LOYALTY': 'outline',
      'TERMINAL': 'destructive',
      'SPECIAL': 'secondary'
    };
    return variants[category] || 'outline';
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading benefit types...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Benefit Types</CardTitle>
            <CardDescription>
              Manage benefit types and their calculation formulas
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Benefit Type
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name / Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Calculation</TableHead>
              <TableHead>Default Amount</TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead>Prorated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {benefitTypes.map((type) => (
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
                  <Badge variant={getCategoryBadgeVariant(type.category)}>
                    {type.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <Badge variant="outline">{type.calculation_type}</Badge>
                    {type.minimum_service_months && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Min: {type.minimum_service_months} months
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(type.default_amount)}</TableCell>
                <TableCell>
                  <Badge variant={type.is_recurring ? 'default' : 'secondary'}>
                    {type.is_recurring ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={type.is_prorated ? 'default' : 'secondary'}>
                    {type.is_prorated ? 'Yes' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={type.is_active ? 'default' : 'secondary'}>
                    {type.is_active ? 'Active' : 'Inactive'}
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
                              <AlertDialogTitle>Delete Benefit Type</AlertDialogTitle>
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
                {editingType ? 'Edit Benefit Type' : 'Create Benefit Type'}
              </DialogTitle>
              <DialogDescription>
                {editingType
                  ? 'Update the benefit type details below.'
                  : 'Add a new benefit type with calculation rules.'
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
                    placeholder="13th Month Pay"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="MID_YEAR"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this benefit type"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: keyof typeof BENEFIT_CATEGORIES) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                      <SelectItem value="PERFORMANCE">Performance</SelectItem>
                      <SelectItem value="LOYALTY">Loyalty</SelectItem>
                      <SelectItem value="TERMINAL">Terminal</SelectItem>
                      <SelectItem value="SPECIAL">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="calculation_type">Calculation Type</Label>
                  <Select
                    value={formData.calculation_type}
                    onValueChange={(value: 'Formula' | 'Fixed' | 'Manual') => setFormData({
                      ...formData,
                      calculation_type: value,
                      calculation_formula: value === 'Formula' ? formData.calculation_formula : ''
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Formula">Formula</SelectItem>
                      <SelectItem value="Fixed">Fixed Amount</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.calculation_type === 'Formula' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calculation_formula">Calculation Formula</Label>
                    <Input
                      id="calculation_formula"
                      value={formData.calculation_formula}
                      onChange={(e) => setFormData({ ...formData, calculation_formula: e.target.value })}
                      placeholder="basic_salary / 12 * (service_months / 12)"
                    />
                  </div>
                  
                  <Collapsible open={formulaHelpOpen} onOpenChange={setFormulaHelpOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-between"
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Formula Help & Examples
                        </div>
                        {formulaHelpOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4">
                      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            📊 Available Variables
                          </h4>
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="flex justify-between items-center p-2 bg-background rounded border">
                              <span><code className="bg-muted px-1 rounded">basic_salary</code> - Employee's monthly basic salary</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-background rounded border">
                              <span><code className="bg-muted px-1 rounded">service_months</code> - Employee's total months of service</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-background rounded border">
                              <span><code className="bg-muted px-1 rounded">daily_rate</code> - Employee's daily rate (basic_salary / 22)</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-background rounded border">
                              <span><code className="bg-muted px-1 rounded">monthly_salary</code> - Employee's current monthly salary</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            🧮 Formula Examples
                          </h4>
                          <div className="space-y-2">
                            <div className="p-3 bg-background rounded border">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <span className="font-medium text-sm">13th Month Bonus</span>
                                  <p className="text-xs text-muted-foreground mt-1">One month equivalent based on service</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormula('basic_salary / 12 * (service_months / 12)')}
                                  className="text-xs h-6 px-2"
                                  type="button"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Use
                                </Button>
                              </div>
                              <code className="text-xs bg-muted px-2 py-1 rounded block">
                                basic_salary / 12 * (service_months / 12)
                              </code>
                            </div>

                            <div className="p-3 bg-background rounded border">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <span className="font-medium text-sm">Performance Bonus (1 Month)</span>
                                  <p className="text-xs text-muted-foreground mt-1">One month basic salary</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormula('basic_salary * 1.0')}
                                  className="text-xs h-6 px-2"
                                  type="button"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Use
                                </Button>
                              </div>
                              <code className="text-xs bg-muted px-2 py-1 rounded block">
                                basic_salary * 1.0
                              </code>
                            </div>

                            <div className="p-3 bg-background rounded border">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <span className="font-medium text-sm">Service Years Bonus</span>
                                  <p className="text-xs text-muted-foreground mt-1">10% of salary per year of service</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormula('basic_salary * (service_months / 12) * 0.1')}
                                  className="text-xs h-6 px-2"
                                  type="button"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Use
                                </Button>
                              </div>
                              <code className="text-xs bg-muted px-2 py-1 rounded block">
                                basic_salary * (service_months / 12) * 0.1
                              </code>
                            </div>

                            <div className="p-3 bg-background rounded border">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <span className="font-medium text-sm">Daily Rate Bonus</span>
                                  <p className="text-xs text-muted-foreground mt-1">30 days worth of daily rate</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormula('daily_rate * 30')}
                                  className="text-xs h-6 px-2"
                                  type="button"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Use
                                </Button>
                              </div>
                              <code className="text-xs bg-muted px-2 py-1 rounded block">
                                daily_rate * 30
                              </code>
                            </div>

                            <div className="p-3 bg-background rounded border">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <span className="font-medium text-sm">Percentage Bonus</span>
                                  <p className="text-xs text-muted-foreground mt-1">5% of basic salary</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => insertFormula('basic_salary * 0.05')}
                                  className="text-xs h-6 px-2"
                                  type="button"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Use
                                </Button>
                              </div>
                              <code className="text-xs bg-muted px-2 py-1 rounded block">
                                basic_salary * 0.05
                              </code>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            ⚙️ Supported Operations
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-background rounded border text-center">
                              <code>+</code> Addition
                            </div>
                            <div className="p-2 bg-background rounded border text-center">
                              <code>-</code> Subtraction
                            </div>
                            <div className="p-2 bg-background rounded border text-center">
                              <code>*</code> Multiplication
                            </div>
                            <div className="p-2 bg-background rounded border text-center">
                              <code>/</code> Division
                            </div>
                            <div className="p-2 bg-background rounded border text-center col-span-2">
                              <code>( )</code> Parentheses for grouping
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="font-medium text-sm text-blue-800 mb-1 flex items-center gap-2">
                            💡 Tips
                          </h4>
                          <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Use parentheses to control calculation order</li>
                            <li>• Test formulas with sample employees before finalizing</li>
                            <li>• Consider proration settings for new employees</li>
                            <li>• Variables are automatically replaced during calculation</li>
                          </ul>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimum_service_months">Minimum Service Months</Label>
                  <Input
                    id="minimum_service_months"
                    type="number"
                    value={formData.minimum_service_months}
                    onChange={(e) => setFormData({ ...formData, minimum_service_months: e.target.value })}
                    placeholder="4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_recurring">Recurring</Label>
                  <Select
                    value={(formData.is_recurring ?? true).toString()}
                    onValueChange={(value) => setFormData({ ...formData, is_recurring: value === 'true' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_prorated"
                    checked={formData.is_prorated}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_prorated: checked })}
                  />
                  <Label htmlFor="is_prorated">Prorated</Label>
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
};

export default BenefitTypesManagement;