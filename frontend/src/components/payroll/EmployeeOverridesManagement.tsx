import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { showToast } from "@/lib/toast"
import { Plus, Edit, Trash2, X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import payrollService from '@/services/payrollService';
import employeeService from '@/services/employeeService';
import type { EmployeeOverride, AllowanceType, DeductionType } from '@/types/payroll';
import type { Employee } from '@/types/employee';

export function EmployeeOverridesManagement() {
  const [overrides, setOverrides] = useState<EmployeeOverride[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOverride, setEditingOverride] = useState<EmployeeOverride | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    employee_id: '',
    type: '' as 'allowance' | 'deduction' | '',
    search: ''
  });

  const [formData, setFormData] = useState({
    employee_id: '',
    type: 'allowance' as 'allowance' | 'deduction',
    type_id: '',
    amount: '',
    effective_from: '',
    effective_to: '',
    notes: ''
  });

  // Combobox state
  const [employeeComboboxOpen, setEmployeeComboboxOpen] = useState(false);
  const [employeeSearchValue, setEmployeeSearchValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadOverrides();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Helper function to get employee full name
  const getEmployeeFullName = (employee: Employee) => {
    const parts = [employee.first_name, employee.middle_name, employee.last_name, employee.suffix]
      .filter(Boolean);
    return parts.join(' ');
  };

  // Filter employees based on search value
  const filteredEmployees = employees.filter(employee => {
    const fullName = getEmployeeFullName(employee);
    const searchTerm = employeeSearchValue.toLowerCase();
    return fullName.toLowerCase().includes(searchTerm) || 
           employee.employee_number?.toLowerCase().includes(searchTerm);
  });

  const loadData = async () => {
    try {
      const [overridesRes, employeesRes, allowancesRes, deductionsRes] = await Promise.all([
        payrollService.getEmployeeOverrides(),
        employeeService.getEmployees(),
        payrollService.getAllowanceTypes(),
        payrollService.getDeductionTypes()
      ]);

      // Debug logging removed

      if (overridesRes.success) {
        const overridesData = overridesRes.data?.overrides || [];
        setOverrides(overridesData);
      }

      // Fix employee response handling
      setEmployees(employeesRes.employees || []);

      if (allowancesRes.success) {
        const allowancesData = Array.isArray(allowancesRes.data) ? allowancesRes.data : (allowancesRes.data as { allowance_types?: AllowanceType[] })?.allowance_types || [];
        setAllowanceTypes(allowancesData);
      }

      if (deductionsRes.success) {
        const deductionsData = Array.isArray(deductionsRes.data) ? deductionsRes.data : (deductionsRes.data as { deduction_types?: DeductionType[] })?.deduction_types || [];
        setDeductionTypes(deductionsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadOverrides = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.employee_id) params.append('employee_id', filters.employee_id);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);

      const response = await payrollService.getEmployeeOverrides();
      if (response.success) {
        let overridesData = response.data?.overrides || [];

        // Apply client-side filtering if needed
        if (filters.employee_id) {
          overridesData = overridesData.filter(o => o.employee_id.toString() === filters.employee_id);
        }
        if (filters.type) {
          overridesData = overridesData.filter(o => o.type === filters.type);
        }
        if (filters.search) {
          overridesData = overridesData.filter(o =>
            o.employee?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            o.allowance_type?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            o.deduction_type?.name?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        setOverrides(overridesData);
      }
    } catch (error) {
      console.error('Failed to load overrides:', error);
      showToast.error('Failed to load overrides');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      type: 'allowance',
      type_id: '',
      amount: '',
      effective_from: '',
      effective_to: '',
      notes: ''
    });
    setEditingOverride(null);
    setEmployeeComboboxOpen(false);
    setEmployeeSearchValue('');
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (override: EmployeeOverride) => {
    setFormData({
      employee_id: override.employee_id.toString(),
      type: override.type,
      type_id: override.type_id.toString(),
      amount: override.amount.toString(),
      effective_from: override.effective_from ? new Date(override.effective_from).toISOString().split('T')[0] : '',
      effective_to: override.effective_to ? new Date(override.effective_to).toISOString().split('T')[0] : '',
      notes: ''
    });
    setEditingOverride(override);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        employee_id: parseInt(formData.employee_id),
        type_id: parseInt(formData.type_id),
        amount: parseFloat(formData.amount),
        effective_from: formData.effective_from,
        effective_to: formData.effective_to || undefined
      };

      let response;
      if (editingOverride) {
        if (formData.type === 'allowance') {
          response = await payrollService.updateAllowanceOverride(editingOverride.id, submitData);
        } else {
          response = await payrollService.updateDeductionOverride(editingOverride.id, submitData);
        }
      } else {
        if (formData.type === 'allowance') {
          response = await payrollService.createAllowanceOverride(submitData);
        } else {
          response = await payrollService.createDeductionOverride(submitData);
        }
      }

      if (response.success) {
        showToast.success(editingOverride ? 'Override updated successfully' : 'Override created successfully');
        setDialogOpen(false);
        resetForm();
        loadOverrides();
      } else {
        showToast.error('Failed to save override');
      }
    } catch (error) {
      console.error('Failed to save override:', error);
      showToast.error('Failed to save override');
    }
  };

  const handleDelete = async (override: EmployeeOverride) => {
    try {
      let response;
      if (override.type === 'allowance') {
        response = await payrollService.deleteAllowanceOverride(override.id);
      } else {
        response = await payrollService.deleteDeductionOverride(override.id);
      }

      if (response.success) {
        showToast.success('Override deleted successfully');
        loadOverrides();
      } else {
        showToast.error('Failed to delete override');
      }
    } catch (error) {
      console.error('Failed to delete override:', error);
      showToast.error('Failed to delete override');
    }
  };

  const clearFilters = () => {
    setFilters({
      employee_id: '',
      type: '',
      search: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeName = (override: EmployeeOverride) => {
    if (override.type === 'allowance') {
      return override.allowance_type?.name || 'Unknown Allowance';
    } else {
      return override.deduction_type?.name || 'Unknown Deduction';
    }
  };

  const getTypeCode = (override: EmployeeOverride) => {
    if (override.type === 'allowance') {
      return override.allowance_type?.code || '';
    } else {
      return override.deduction_type?.code || '';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading employee overrides...</div>;
  }

  const filteredOverrides = overrides;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Employee Overrides</CardTitle>
            <CardDescription>
              Manage employee-specific allowance and deduction overrides
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Override
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="filter-employee" className="text-sm font-medium">Employee</Label>
            <Select
              value={filters.employee_id || 'all'}
              onValueChange={(value) => setFilters({ ...filters, employee_id: value === 'all' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {getEmployeeFullName(employee)} ({employee.employee_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="filter-type" className="text-sm font-medium">Type</Label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value: 'allowance' | 'deduction' | 'all') => setFilters({ ...filters, type: value === 'all' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="allowance">Allowances</SelectItem>
                <SelectItem value="deduction">Deductions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="filter-search" className="text-sm font-medium">Search</Label>
            <Input
              id="filter-search"
              placeholder="Search employee or type name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Override Amount</TableHead>
              <TableHead>Effective Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOverrides.map((override) => (
              <TableRow key={override.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{override.employee?.full_name}</div>
                    <div className="text-sm text-muted-foreground">{override.employee?.employee_id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={override.type === 'allowance' ? 'default' : 'secondary'}>
                        {override.type}
                      </Badge>
                      <span className="font-medium">{getTypeName(override)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{getTypeCode(override)}</div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(override.amount)}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>From: {formatDate(override.effective_from)}</div>
                    {override.effective_to && (
                      <div>To: {formatDate(override.effective_to)}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={override.is_active ? 'default' : 'secondary'}>
                    {override.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(override)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(override)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredOverrides.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No overrides found. {filters.employee_id || filters.type || filters.search ? 'Try adjusting your filters.' : 'Create your first override to get started.'}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOverride ? 'Edit Employee Override' : 'Create Employee Override'}
              </DialogTitle>
              <DialogDescription>
                {editingOverride 
                  ? 'Update the employee override details below.'
                  : 'Create a new employee-specific allowance or deduction override.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="employee_id">Employee *</Label>
                  <Popover open={employeeComboboxOpen} onOpenChange={setEmployeeComboboxOpen}>
                    <PopoverTrigger asChild className='w-full'>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={employeeComboboxOpen}
                        className="w-full justify-between"
                        disabled={!!editingOverride}
                      >
                        {formData.employee_id
                          ? (() => {
                              const selectedEmployee = employees.find(
                                (employee) => employee.id.toString() === formData.employee_id
                              );
                              return selectedEmployee
                                ? `${getEmployeeFullName(selectedEmployee)} (${selectedEmployee.employee_number})`
                                : "Select employee...";
                            })()
                          : "Select employee..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <div className="flex flex-col">
                        <div className="p-2">
                          <Input
                            placeholder="Search employees..."
                            value={employeeSearchValue}
                            onChange={(e) => setEmployeeSearchValue(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="max-h-[200px] overflow-auto">
                          {filteredEmployees.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No employee found.
                            </div>
                          ) : (
                            filteredEmployees.map((employee) => (
                              <div
                                key={employee.id}
                                className={cn(
                                  "flex cursor-pointer items-center justify-between px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                                  formData.employee_id === employee.id.toString() && "bg-accent"
                                )}
                                onClick={() => {
                                  setFormData({ ...formData, employee_id: employee.id.toString() });
                                  setEmployeeComboboxOpen(false);
                                  setEmployeeSearchValue('');
                                }}
                              >
                                <span>
                                  {getEmployeeFullName(employee)} ({employee.employee_number})
                                </span>
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4",
                                    formData.employee_id === employee.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Override Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'allowance' | 'deduction') => setFormData({ 
                      ...formData, 
                      type: value,
                      type_id: '' // Reset type_id when changing type
                    })}
                    disabled={!!editingOverride}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allowance">Allowance</SelectItem>
                      <SelectItem value="deduction">Deduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="type_id">
                    {formData.type === 'allowance' ? 'Allowance Type' : 'Deduction Type'} *
                  </Label>
                  <Select
                    value={formData.type_id}
                    onValueChange={(value) => setFormData({ ...formData, type_id: value })}
                    disabled={!!editingOverride}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder={`Select ${formData.type} type`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.type === 'allowance' ? allowanceTypes : deductionTypes).map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Override Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  id="effective_from"
                  label="Effective From"
                  value={formData.effective_from ? new Date(formData.effective_from) : undefined}
                  onChange={(date) => setFormData({ ...formData, effective_from: date ? date.toISOString().split('T')[0] : '' })}
                  required
                  placeholder="Select start date"
                />
                <DatePicker
                  id="effective_to"
                  label="Effective To"
                  value={formData.effective_to ? new Date(formData.effective_to) : undefined}
                  onChange={(date) => setFormData({ ...formData, effective_to: date ? date.toISOString().split('T')[0] : '' })}
                  placeholder="Select end date (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingOverride ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}