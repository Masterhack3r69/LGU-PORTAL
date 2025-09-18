import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { payrollService } from '../services/payrollService';
import { payrollSystemService } from '../services/payrollSystemService';
import { payrollDeductionTypesService } from '../services/payrollDeductionTypesService';
import { payrollAllowanceTypesService } from '../services/payrollAllowanceTypesService';
import type {
  ManualPayrollEmployee,
  PayrollPeriod,
} from '../types/payroll';
import type { PayrollDeductionType } from '../services/payrollDeductionTypesService';
import type { PayrollAllowanceType } from '../services/payrollAllowanceTypesService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Users,
  RefreshCw,
  Search,
  FileText
} from 'lucide-react';
// Add Table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: string;
}

const ManualPayrollPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [employees, setEmployees] = useState<ManualPayrollEmployee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  const toast = useCallback((options: ToastOptions) => {
    console.log('Toast:', options);
    alert(options.description || options.title);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [employeesResponse, periodsResponse] = await Promise.all([
        apiService.get<{ success: boolean; data: ManualPayrollEmployee[] }>('/employees'),
        payrollService.getPayrollPeriods({ status: 'Draft', limit: 20 })
      ]);

      if (employeesResponse.success) {
        setEmployees(employeesResponse.data.filter(emp => emp.employment_status === 'Active'));
      }

      if (periodsResponse.success) {
        setPayrollPeriods(periodsResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const filteredEmployees = employees.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle employee selection
  const toggleEmployeeSelection = (employeeId: number) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId) 
        : [...prev, employeeId]
    );
  };

  // Select all employees
  const selectAllEmployees = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  // Handle bulk processing
  const handleBulkProcess = async () => {
    // Show the bulk processing dialog instead of prompt
    setIsBulkDialogOpen(true);
  };

  // Handle actual bulk processing with selected types
  const processBulkPayroll = async (
    periodId: number,
    selectedAllowanceTypeIds: number[],
    selectedDeductionTypeIds: number[]
  ) => {
    try {
      // Call the bulk processing endpoint
      const response = await payrollSystemService.bulkProcessPayroll(
        periodId,
        selectedEmployees,
        selectedAllowanceTypeIds,
        selectedDeductionTypeIds
      );
      
      if (response.success) {
        toast({ 
          title: "Success", 
          description: `Bulk payroll processed successfully. ${response.data.payroll_items_created} items created.` 
        });
        // Clear selection
        setSelectedEmployees([]);
        // Close dialog
        setIsBulkDialogOpen(false);
        // Reload data
        loadData();
      } else {
        throw new Error(response.message || "Failed to process bulk payroll");
      }
    } catch (error) {
      console.error('Error processing bulk payroll:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to process bulk payroll", 
        variant: "destructive" 
      });
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Manual Payroll Processing</h1>
            <p className="text-muted-foreground">
              Process payroll for individual employees with automated allowances and deductions
            </p>
          </div>
          <div className="flex gap-2">
            {selectedEmployees.length > 0 && (
              <Button onClick={handleBulkProcess}>
                <FileText className="h-4 w-4 mr-2" />
                Process {selectedEmployees.length} Selected
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employee Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                  onCheckedChange={selectAllEmployees}
                />
              </TableHead>
              <TableHead>Employee Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Loading employees...</p>
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <TableRow 
                  key={employee.id} 
                  className={selectedEmployees.includes(employee.id) ? "bg-muted" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{employee.employee_number}</TableCell>
                  <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                  <TableCell>{employee.plantilla_position}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{employee.employment_status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">

                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No employees found matching your search.' : 'No active employees found.'}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Processing Dialog */}
      <BulkProcessDialog
        isOpen={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
        payrollPeriods={payrollPeriods}
        selectedEmployees={selectedEmployees}
        employees={employees}
        onProcess={processBulkPayroll}
        payrollAllowanceTypesService={payrollAllowanceTypesService}
        payrollDeductionTypesService={payrollDeductionTypesService}
      />
    </div>
  );
}

// New Bulk Process Dialog Component
interface BulkProcessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  payrollPeriods: PayrollPeriod[];
  selectedEmployees: number[];
  employees: ManualPayrollEmployee[];
  onProcess: (periodId: number, selectedAllowanceTypes: number[], selectedDeductionTypes: number[]) => void;
  payrollAllowanceTypesService: typeof payrollAllowanceTypesService;
  payrollDeductionTypesService: typeof payrollDeductionTypesService;
}

const BulkProcessDialog: React.FC<BulkProcessDialogProps> = ({
  isOpen,
  onOpenChange,
  payrollPeriods,
  selectedEmployees,
  employees,
  onProcess,
  payrollAllowanceTypesService,
  payrollDeductionTypesService
}) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [selectedAllowanceTypes, setSelectedAllowanceTypes] = useState<number[]>([]);
  const [selectedDeductionTypes, setSelectedDeductionTypes] = useState<number[]>([]);
  const [allowanceTypes, setAllowanceTypes] = useState<PayrollAllowanceType[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<PayrollDeductionType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get selected employee objects
  const selectedEmployeeObjects = employees.filter(emp => selectedEmployees.includes(emp.id));

  // Load allowance and deduction types when dialog opens
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const [allowanceResponse, deductionResponse] = await Promise.all([
            payrollAllowanceTypesService.getPayrollAllowances({ is_active: true }),
            payrollDeductionTypesService.getPayrollDeductions({ is_active: true })
          ]);
          
          if (allowanceResponse.success) {
            setAllowanceTypes(allowanceResponse.data);
          }
          
          if (deductionResponse.success) {
            setDeductionTypes(deductionResponse.data);
          }
        } catch (error) {
          console.error('Error loading allowance/deduction types:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }
  }, [isOpen, payrollAllowanceTypesService, payrollDeductionTypesService]);

  // Toggle allowance type selection
  const toggleAllowanceType = (id: number) => {
    setSelectedAllowanceTypes(prev => 
      prev.includes(id) 
        ? prev.filter(typeId => typeId !== id) 
        : [...prev, id]
    );
  };

  // Toggle deduction type selection
  const toggleDeductionType = (id: number) => {
    setSelectedDeductionTypes(prev => 
      prev.includes(id) 
        ? prev.filter(typeId => typeId !== id) 
        : [...prev, id]
    );
  };

  // Select all allowance types
  const selectAllAllowanceTypes = () => {
    if (selectedAllowanceTypes.length === allowanceTypes.length) {
      setSelectedAllowanceTypes([]);
    } else {
      setSelectedAllowanceTypes(allowanceTypes.map(type => type.id));
    }
  };

  // Select all deduction types
  const selectAllDeductionTypes = () => {
    if (selectedDeductionTypes.length === deductionTypes.length) {
      setSelectedDeductionTypes([]);
    } else {
      setSelectedDeductionTypes(deductionTypes.map(type => type.id));
    }
  };

  // Handle process button click
  const handleProcess = () => {
    if (!selectedPeriodId) {
      alert("Please select a payroll period");
      return;
    }
    
    onProcess(selectedPeriodId, selectedAllowanceTypes, selectedDeductionTypes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Bulk Payroll Processing</DialogTitle>
          <DialogDescription>
            Process payroll for {selectedEmployees.length} selected employee(s) with custom allowance and deduction types.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Selected Employees Summary */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Selected Employees ({selectedEmployees.length})</h3>
            <div className="max-h-32 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedEmployeeObjects.map(employee => (
                  <div key={employee.id} className="text-sm flex items-center">
                    <span className="mr-2">•</span>
                    <span>{employee.employee_number} - {employee.first_name} {employee.last_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Period Selection */}
          <div>
            <Label>Payroll Period *</Label>
            <Select
              value={selectedPeriodId?.toString() || ''}
              onValueChange={(value) => setSelectedPeriodId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payroll period" />
              </SelectTrigger>
              <SelectContent>
                {payrollPeriods.map((period) => (
                  <SelectItem key={period.id} value={period.id.toString()}>
                    <div className="flex justify-between items-center w-full">
                      <span>{period.year} - {period.month === 1 ? 'January' : period.month === 2 ? 'February' : period.month === 3 ? 'March' : period.month === 4 ? 'April' : period.month === 5 ? 'May' : period.month === 6 ? 'June' : period.month === 7 ? 'July' : period.month === 8 ? 'August' : period.month === 9 ? 'September' : period.month === 10 ? 'October' : period.month === 11 ? 'November' : 'December'} (Period {period.period_number})</span>
                      <Badge className={payrollService.getStatusColor(period.status)}>
                        {period.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allowance Types Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="text-green-700">Allowance Types</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAllAllowanceTypes}
                    >
                      {selectedAllowanceTypes.length === allowanceTypes.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {allowanceTypes.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {allowanceTypes.map((type) => (
                        <div 
                          key={type.id} 
                          className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                            selectedAllowanceTypes.includes(type.id) 
                              ? 'bg-green-50 border border-green-200' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => toggleAllowanceType(type.id)}
                        >
                          <div className="flex items-center">
                            <Checkbox
                              checked={selectedAllowanceTypes.includes(type.id)}
                              onCheckedChange={() => toggleAllowanceType(type.id)}
                              className="mr-2"
                            />
                            <div>
                              <div className="font-medium text-sm">{type.name}</div>
                              <div className="text-xs text-gray-500">{type.code}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {payrollAllowanceTypesService.formatCurrency(type.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {type.is_monthly ? 'Monthly' : 'One-time'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No active allowance types found</p>
                  )}
                </CardContent>
              </Card>
              
              {/* Deduction Types Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="text-red-700">Deduction Types</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAllDeductionTypes}
                    >
                      {selectedDeductionTypes.length === deductionTypes.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {deductionTypes.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {deductionTypes.map((type) => (
                        <div 
                          key={type.id} 
                          className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                            selectedDeductionTypes.includes(type.id) 
                              ? 'bg-red-50 border border-red-200' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => toggleDeductionType(type.id)}
                        >
                          <div className="flex items-center">
                            <Checkbox
                              checked={selectedDeductionTypes.includes(type.id)}
                              onCheckedChange={() => toggleDeductionType(type.id)}
                              className="mr-2"
                            />
                            <div>
                              <div className="font-medium text-sm">{type.name}</div>
                              <div className="text-xs text-gray-500">{type.code}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {type.deduction_type === 'percentage' 
                                ? `${type.percentage}%` 
                                : payrollDeductionTypesService.formatCurrency(type.amount)}
                            </div>
                            <div className="flex gap-1">
                              {type.is_government && (
                                <Badge variant="outline" className="text-xs">
                                  Gov
                                </Badge>
                              )}
                              {type.is_mandatory && (
                                <Badge variant="outline" className="text-xs">
                                  Mandatory
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No active deduction types found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcess}
              disabled={!selectedPeriodId || isLoading}
            >
              Process Payroll
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualPayrollPage;