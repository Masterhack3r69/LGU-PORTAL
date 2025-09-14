// pages/Compensation.tsx - Compensation Management Interface
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Edit,
  Trash,
  DollarSign,
  Calendar,
  User,
  FileText,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { compensationService, type CompensationFilters } from '../services/compensationService';
import { employeeService } from '../services/employeeService';
import type {
  EmployeeCompensation,
  CompensationType,
  CreateCompensationForm
} from '../types/payroll';
import type { Employee } from '../types/employee';
import { MONTH_OPTIONS } from '../types/payroll';

export const Compensation: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State management
  const [compensationRecords, setCompensationRecords] = useState<EmployeeCompensation[]>([]);
  const [compensationTypes, setCompensationTypes] = useState<CompensationType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<EmployeeCompensation | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filters, setFilters] = useState<CompensationFilters>({
    page: 1,
    limit: 20
  });

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [createForm, setCreateForm] = useState<CreateCompensationForm>({
    employee_id: 0,
    compensation_type_id: 0,
    amount: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    date_paid: '',
    reference_number: '',
    notes: ''
  });

  const [editForm, setEditForm] = useState<Partial<CreateCompensationForm>>({});

  // Load data
  const loadCompensationRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await compensationService.getCompensationRecords(filters);
      setCompensationRecords(response.data);
    } catch (error) {
      console.error('Failed to load compensation records:', error);
      toast.error('Failed to load compensation records');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadCompensationTypes = useCallback(async () => {
    try {
      const response = await compensationService.getCompensationTypes();
      setCompensationTypes(response.data);
    } catch (error) {
      console.error('Failed to load compensation types:', error);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getEmployees({});
      setEmployees(response.employees);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadCompensationRecords();
      loadCompensationTypes();
      loadEmployees();
    }
  }, [isAdmin, loadCompensationRecords, loadCompensationTypes, loadEmployees]);

  // Form handlers
  const handleCreateCompensation = async () => {
    try {
      setActionLoading('create');
      
      // Validation
      if (!createForm.employee_id || !createForm.compensation_type_id || !createForm.amount) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (createForm.amount <= 0) {
        toast.error('Amount must be greater than 0');
        return;
      }

      await compensationService.createCompensation(createForm);
      toast.success('Compensation record created successfully');
      setShowCreateDialog(false);
      resetCreateForm();
      loadCompensationRecords();
    } catch (error) {
      console.error('Failed to create compensation record:', error);
      toast.error('Failed to create compensation record');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditCompensation = async () => {
    try {
      if (!selectedRecord) return;
      
      setActionLoading('edit');
      
      await compensationService.updateCompensation(selectedRecord.id, editForm);
      toast.success('Compensation record updated successfully');
      setShowEditDialog(false);
      setSelectedRecord(null);
      setEditForm({});
      loadCompensationRecords();
    } catch (error) {
      console.error('Failed to update compensation record:', error);
      toast.error('Failed to update compensation record');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCompensation = async () => {
    try {
      if (!selectedRecord) return;
      
      setActionLoading('delete');
      
      await compensationService.deleteCompensation(selectedRecord.id);
      toast.success('Compensation record deleted successfully');
      setShowDeleteDialog(false);
      setSelectedRecord(null);
      loadCompensationRecords();
    } catch (error) {
      console.error('Failed to delete compensation record:', error);
      toast.error('Failed to delete compensation record');
    } finally {
      setActionLoading(null);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      employee_id: 0,
      compensation_type_id: 0,
      amount: 0,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      date_paid: '',
      reference_number: '',
      notes: ''
    });
  };

  const openEditDialog = (record: EmployeeCompensation) => {
    setSelectedRecord(record);
    setEditForm({
      amount: record.amount,
      date_paid: record.date_paid || '',
      reference_number: record.reference_number || '',
      notes: record.notes || ''
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (record: EmployeeCompensation) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  const getEmployeeName = (employeeId: number, record?: EmployeeCompensation): string => {
    // First try to use the data from the record (joined from backend)
    if (record && record.first_name && record.last_name) {
      return `${record.first_name} ${record.last_name}`;
    }
    
    // Fallback to finding in employees array
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  };

  const getEmployeeNumber = (employeeId: number, record?: EmployeeCompensation): string => {
    // First try to use the data from the record (joined from backend)
    if (record && record.employee_number) {
      return record.employee_number;
    }
    
    // Fallback to finding in employees array
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.employee_number : '';
  };

  const getCompensationTypeName = (typeId: number, record?: EmployeeCompensation): string => {
    // First try to use the data from the record (joined from backend)
    if (record && record.compensation_type_name) {
      return record.compensation_type_name;
    }
    
    // Fallback to finding in compensation types array
    const type = compensationTypes.find(t => t.id === typeId);
    return type ? type.name : 'Unknown Type';
  };

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Only administrators can access the compensation management system.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compensation Management</h1>
          <p className="text-gray-600">Manage employee compensation records and allowances</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Compensation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Compensation Record</DialogTitle>
              <DialogDescription>
                Create a new compensation record for an employee
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee">Employee *</Label>
                  <Select
                    value={createForm.employee_id.toString()}
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, employee_id: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.filter(emp => emp.employment_status === 'Active').map(employee => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.first_name} {employee.last_name} ({employee.employee_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="compensation_type">Compensation Type *</Label>
                  <Select
                    value={createForm.compensation_type_id.toString()}
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, compensation_type_id: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {compensationTypes.map(type => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name} ({type.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2020"
                    max="2030"
                    value={createForm.year}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label htmlFor="month">Month</Label>
                  <Select
                    value={createForm.month?.toString() || ''}
                   onValueChange={(value) => setCreateForm(prev => ({ ...prev, month: value && !value.startsWith('__') ? parseInt(value) : undefined }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                     <SelectItem value="__no_month__">No specific month</SelectItem>
                      {MONTH_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date_paid">Date Paid</Label>
                  <Input
                    id="date_paid"
                    type="date"
                    value={createForm.date_paid}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, date_paid: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="reference_number">Reference Number</Label>
                  <Input
                    id="reference_number"
                    value={createForm.reference_number}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="Optional reference"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes or comments"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCompensation} disabled={actionLoading === 'create'}>
                  {actionLoading === 'create' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Create Record
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compensationRecords.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {compensationService.formatCompensationAmount(
                compensationRecords.reduce((sum, record) => sum + record.amount, 0)
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter(emp => emp.employment_status === 'Active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {compensationRecords.filter(record => 
                record.month === new Date().getMonth() + 1 && 
                record.year === new Date().getFullYear()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="filter-employee">Employee</Label>
              <Select
                value={filters.employee_id?.toString() || ''}
               onValueChange={(value) => setFilters(prev => ({ ...prev, employee_id: value && !value.startsWith('__') ? parseInt(value) : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                 <SelectItem value="__all_employees__">All employees</SelectItem>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-type">Compensation Type</Label>
              <Select
                value={filters.compensation_type_id?.toString() || ''}
               onValueChange={(value) => setFilters(prev => ({ ...prev, compensation_type_id: value && !value.startsWith('__') ? parseInt(value) : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                 <SelectItem value="__all_types__">All types</SelectItem>
                  {compensationTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-year">Year</Label>
              <Select
                value={filters.year?.toString() || ''}
               onValueChange={(value) => setFilters(prev => ({ ...prev, year: value && !value.startsWith('__') ? parseInt(value) : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                 <SelectItem value="__all_years__">All years</SelectItem>
                  {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-month">Month</Label>
              <Select
                value={filters.month?.toString() || ''}
               onValueChange={(value) => setFilters(prev => ({ ...prev, month: value && !value.startsWith('__') ? parseInt(value) : undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                 <SelectItem value="__all_months__">All months</SelectItem>
                  {MONTH_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={loadCompensationRecords}
                className="w-full"
              >
                <Search className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compensation Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compensation Records</CardTitle>
          <CardDescription>
            Employee compensation and allowance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading compensation records...</span>
            </div>
          ) : compensationRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No compensation records found. Add your first compensation record to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Date Paid</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compensationRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getEmployeeName(record.employee_id, record)}</div>
                        <div className="text-sm text-gray-500">{getEmployeeNumber(record.employee_id, record)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCompensationTypeName(record.compensation_type_id, record)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {compensationService.formatCompensationAmount(record.amount)}
                    </TableCell>
                    <TableCell>
                      {record.month ? `${MONTH_OPTIONS.find(m => m.value === record.month)?.label} ` : ''}{record.year}
                    </TableCell>
                    <TableCell>
                      {record.date_paid ? new Date(record.date_paid).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      {record.reference_number || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(record)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Compensation Record</DialogTitle>
            <DialogDescription>
              Update the compensation record details
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">Employee:</div>
                <div className="font-medium">{getEmployeeName(selectedRecord.employee_id, selectedRecord)}</div>
                <div className="text-sm text-gray-600 mt-1">Type:</div>
                <div className="font-medium">{getCompensationTypeName(selectedRecord.compensation_type_id, selectedRecord)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.amount || 0}
                    onChange={(e) => setEditForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-date-paid">Date Paid</Label>
                  <Input
                    id="edit-date-paid"
                    type="date"
                    value={editForm.date_paid || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, date_paid: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-reference">Reference Number</Label>
                <Input
                  id="edit-reference"
                  value={editForm.reference_number || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, reference_number: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditCompensation} disabled={actionLoading === 'edit'}>
                  {actionLoading === 'edit' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Update Record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Compensation Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this compensation record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="font-medium">{getEmployeeName(selectedRecord.employee_id, selectedRecord)}</div>
                <div className="text-sm text-gray-600">{getCompensationTypeName(selectedRecord.compensation_type_id, selectedRecord)}</div>
                <div className="text-lg font-bold mt-1">
                  {compensationService.formatCompensationAmount(selectedRecord.amount)}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteCompensation} 
                  disabled={actionLoading === 'delete'}
                >
                  {actionLoading === 'delete' && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Delete Record
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};