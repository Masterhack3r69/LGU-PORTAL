// components/tlb/TLBRecordForm.tsx - TLB Record Create/Edit Form
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { employeeService } from '@/services/employeeService';
import { tlbService } from '@/services/tlbService';
import { toast } from 'sonner';
import type { TLBRecord, CreateTLBRecordForm, UpdateTLBRecordForm, TLBStatus } from '@/types/tlb';
import type { Employee } from '@/types/employee';

interface TLBRecordFormProps {
  record?: TLBRecord;
  onSuccess: () => void;
}

interface FormData {
  employee_id?: number;
  total_leave_credits?: number;
  highest_monthly_salary?: number;
  constant_factor?: number;
  claim_date?: string;
  separation_date?: string;
  notes?: string;
  status?: TLBStatus;
  check_number?: string;
  payment_date?: string;
}

export function TLBRecordForm({ record, onSuccess }: TLBRecordFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    employee_id: record?.employee_id || undefined,
    total_leave_credits: record?.total_leave_credits || undefined,
    highest_monthly_salary: record?.highest_monthly_salary || undefined,
    constant_factor: record?.constant_factor || 1.0,
    claim_date: record?.claim_date || '',
    separation_date: record?.separation_date || '',
    notes: record?.notes || '',
    status: record?.status || 'Computed',
    check_number: record?.check_number || '',
    payment_date: record?.payment_date || '',
  });

  const isEdit = Boolean(record);

  useEffect(() => {
    if (!isEdit) {
      fetchEmployees();
    }
  }, [isEdit]);

  // Auto-calculate when values change
  useEffect(() => {
    if (!isEdit && formData.total_leave_credits && formData.highest_monthly_salary && formData.constant_factor) {
      const amount = formData.total_leave_credits * formData.highest_monthly_salary * formData.constant_factor;
      setCalculatedAmount(amount);
    }
  }, [formData.total_leave_credits, formData.highest_monthly_salary, formData.constant_factor, isEdit]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getEmployees({ limit: 1000 });
      setEmployees(response.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const handleCalculateFromAPI = async () => {
    if (!formData.employee_id || !formData.separation_date || !formData.claim_date) {
      toast.error('Please fill in employee, separation date, and claim date');
      return;
    }

    try {
      setCalculating(true);
      const calculation = await tlbService.calculateTLB({
        employeeId: formData.employee_id,
        separationDate: formData.separation_date,
        claimDate: formData.claim_date,
      });

      setFormData(prev => ({
        ...prev,
        total_leave_credits: calculation.calculation.total_leave_credits,
        highest_monthly_salary: calculation.calculation.highest_monthly_salary,
        constant_factor: calculation.calculation.constant_factor,
      }));
      setCalculatedAmount(calculation.calculation.computed_amount);

      toast.success('TLB calculation completed');
    } catch (error) {
      console.error('Error calculating TLB:', error);
      toast.error('Failed to calculate TLB');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (isEdit && record) {
        const updateData: UpdateTLBRecordForm = {
          status: formData.status,
          check_number: formData.check_number,
          payment_date: formData.payment_date,
          notes: formData.notes,
        };
        await tlbService.updateTLBRecord(record.id, updateData);
        toast.success('TLB record updated successfully');
      } else {
        const createData: CreateTLBRecordForm = {
          employee_id: formData.employee_id!,
          total_leave_credits: formData.total_leave_credits!,
          highest_monthly_salary: formData.highest_monthly_salary!,
          constant_factor: formData.constant_factor || 1.0,
          claim_date: formData.claim_date!,
          separation_date: formData.separation_date!,
          notes: formData.notes,
        };
        await tlbService.createTLBRecord(createData);
        toast.success('TLB record created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving TLB record:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} TLB record`);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEdit && record ? (
        // Edit form - show record details and allow status updates
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Employee:</strong> {record.employee_name}
                </div>
                <div>
                  <strong>Employee #:</strong> {record.employee_number}
                </div>
                <div>
                  <strong>Position:</strong> {record.plantilla_position}
                </div>
                <div>
                  <strong>Computed Amount:</strong>{' '}
                  <span className="font-mono text-lg">
                    {tlbService.formatCurrency(record.computed_amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || record.status}
                onValueChange={(value) => updateFormData('status', value as TLBStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computed">Computed</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="check_number">Check Number</Label>
              <Input
                id="check_number"
                value={formData.check_number || ''}
                onChange={(e) => updateFormData('check_number', e.target.value)}
                placeholder="CHK-2024-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date">Payment Date</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date || ''}
              onChange={(e) => updateFormData('payment_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>
      ) : (
        // Create form - full form with calculation features
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee_id">Employee *</Label>
            <Select
              value={formData.employee_id?.toString() || ''}
              onValueChange={(value) => updateFormData('employee_id', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.first_name} {emp.last_name} ({emp.employee_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="separation_date">Separation Date *</Label>
              <Input
                id="separation_date"
                type="date"
                value={formData.separation_date || ''}
                onChange={(e) => updateFormData('separation_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claim_date">Claim Date *</Label>
              <Input
                id="claim_date"
                type="date"
                value={formData.claim_date || ''}
                onChange={(e) => updateFormData('claim_date', e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>TLB Calculation</CardTitle>
              <CardDescription>
                Fill in the values manually or use auto-calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                onClick={handleCalculateFromAPI}
                disabled={calculating || !formData.employee_id || !formData.separation_date || !formData.claim_date}
                className="w-full"
              >
                {calculating ? 'Calculating...' : 'Auto-Calculate from System'}
              </Button>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_leave_credits">Leave Credits *</Label>
                  <Input
                    id="total_leave_credits"
                    type="number"
                    step="0.5"
                    value={formData.total_leave_credits || ''}
                    onChange={(e) => updateFormData('total_leave_credits', parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="highest_monthly_salary">Highest Salary *</Label>
                  <Input
                    id="highest_monthly_salary"
                    type="number"
                    step="0.01"
                    value={formData.highest_monthly_salary || ''}
                    onChange={(e) => updateFormData('highest_monthly_salary', parseFloat(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="constant_factor">Factor</Label>
                  <Input
                    id="constant_factor"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="2.0"
                    value={formData.constant_factor || 1.0}
                    onChange={(e) => updateFormData('constant_factor', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {calculatedAmount && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Computed Amount:</div>
                  <div className="text-2xl font-bold font-mono">
                    {tlbService.formatCurrency(calculatedAmount)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder="Additional notes or remarks..."
              rows={3}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? `${isEdit ? 'Updating' : 'Creating'}...`
            : `${isEdit ? 'Update' : 'Create'} Record`}
        </Button>
      </div>
    </form>
  );
}