import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users, UserCheck, Search } from 'lucide-react';
import benefitsService from '@/services/benefitsService';
import type { BenefitCycle, EligibleEmployee } from '@/types/benefits';

interface BenefitEmployeeSelectionProps {
  cycle: BenefitCycle;
  onProceed: (selectedEmployees: EligibleEmployee[]) => void;
  onBack: () => void;
}

const BenefitEmployeeSelection: React.FC<BenefitEmployeeSelectionProps> = ({
  cycle,
  onProceed,
  onBack
}) => {
  const [employees, setEmployees] = useState<EligibleEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EligibleEmployee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<EligibleEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'auto' | 'manual'>('auto');

  useEffect(() => {
    loadEligibleEmployees();
  }, [cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, departmentFilter, showEligibleOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEligibleEmployees = async () => {
    try {
      setLoading(true);
      const response = await benefitsService.getEligibleEmployees(
        cycle.benefit_type_id,
        cycle.cycle_year
      );

      if (response.success) {
        const data = response.data;
        const employeesData = Array.isArray(data) ? data : (data as { employees?: EligibleEmployee[] })?.employees || [];
        setEmployees(employeesData);

        // Auto-select eligible employees for annual benefits
        if (['ANNUAL', 'LOYALTY'].includes(cycle.benefit_type?.category || '')) {
          const eligibleEmployees = employeesData.filter(emp => emp.is_eligible);
          setSelectedEmployees(eligibleEmployees);
          setSelectionMode('auto');
        } else {
          setSelectionMode('manual');
        }
      } else {
        toast.error('Failed to load eligible employees');
      }
    } catch (error) {
      console.error('Failed to load eligible employees:', error);
      toast.error('Failed to load eligible employees');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (departmentFilter) {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    // Eligibility filter
    if (showEligibleOnly) {
      filtered = filtered.filter(emp => emp.is_eligible);
    }

    setFilteredEmployees(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(filteredEmployees);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (employee: EligibleEmployee, checked: boolean) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, employee]);
    } else {
      setSelectedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
    }
  };

  const getUniqueDepartments = () => {
    const departments = [...new Set(employees.map(emp => emp.department))];
    return departments.sort();
  };

  const getEligibilityBadge = (employee: EligibleEmployee) => {
    if (!employee.is_eligible) {
      return <Badge variant="secondary">Not Eligible</Badge>;
    }
    return <Badge variant="default">Eligible</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading employees...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employee Selection
          </CardTitle>
          <CardDescription>
            Select employees for {cycle.cycle_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selection Mode */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="font-medium">Selection Mode</div>
              <div className="text-sm text-muted-foreground">
                {selectionMode === 'auto'
                  ? 'Auto-selected eligible employees'
                  : 'Manual employee selection'
                }
              </div>
            </div>
            <Badge variant={selectionMode === 'auto' ? 'default' : 'outline'}>
              {selectionMode === 'auto' ? 'Automatic' : 'Manual'}
            </Badge>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All departments</SelectItem>
                  {getUniqueDepartments().map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="eligible-only"
                checked={showEligibleOnly}
                onCheckedChange={(checked) => setShowEligibleOnly(checked === true)}
              />
              <Label htmlFor="eligible-only">Eligible only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all">Select all visible</Label>
            </div>
          </div>

          {/* Employee Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Service Years</TableHead>
                  <TableHead>Eligibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedEmployees.some(emp => emp.id === employee.id)}
                        onCheckedChange={(checked) => handleSelectEmployee(employee, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.full_name}</div>
                        <div className="text-sm text-muted-foreground">{employee.employee_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {employee.service_years} years, {employee.service_months} months
                      </div>
                    </TableCell>
                    <TableCell>
                      {getEligibilityBadge(employee)}
                      {!employee.is_eligible && employee.eligibility_reason && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {employee.eligibility_reason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Selection Summary */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span className="font-medium">
                  {selectedEmployees.length} of {filteredEmployees.length} employees selected
                </span>
              </div>
              {selectionMode === 'auto' && (
                <Badge variant="outline">Auto-selected eligible employees</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={() => onProceed(selectedEmployees)}
          disabled={selectedEmployees.length === 0}
        >
          Proceed to Calculation ({selectedEmployees.length} employees)
        </Button>
      </div>
    </div>
  );
};

export default BenefitEmployeeSelection;