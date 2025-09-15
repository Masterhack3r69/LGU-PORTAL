import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  CalendarIcon, 
  RotateCcw,
  Users,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import trainingService from '@/services/trainingService';
import { employeeService } from '@/services/employeeService';
import type { 
  TrainingFilters, 
  TrainingProgram, 
  TrainingType 
} from '@/types/training';
import type { Employee } from '@/types/employee';

interface TrainingFiltersComponentProps {
  filters: Partial<TrainingFilters>;
  onFiltersChange: (filters: Partial<TrainingFilters>) => void;
  showEmployeeFilter?: boolean;
  className?: string;
}

const trainingTypes: TrainingType[] = ['Internal', 'External', 'Online', 'Seminar', 'Workshop'];

const TrainingFiltersComponent: React.FC<TrainingFiltersComponentProps> = ({
  filters,
  onFiltersChange,
  showEmployeeFilter = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesData, programs] = await Promise.all([
          showEmployeeFilter ? employeeService.getEmployees() : Promise.resolve({ employees: [] }),
          trainingService.getTrainingPrograms()
        ]);
        
        setEmployees(Array.isArray(employeesData) ? employeesData : employeesData.employees || []);
        setTrainingPrograms(programs);
      } catch (error) {
        console.error('Failed to load filter data:', error);
      }
    };
    loadData();
  }, [showEmployeeFilter]);

  const handleFilterChange = (key: keyof TrainingFilters, value: unknown) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filters change
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit || 10,
    });
  };

  const clearFilter = (key: keyof TrainingFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Search: {filters.search}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('search')}
                  />
                </Badge>
              )}
              {filters.employee_id && (
                <Badge variant="secondary" className="gap-1">
                  Employee: {employees.find(e => e.id === filters.employee_id)?.first_name || 'Selected'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('employee_id')}
                  />
                </Badge>
              )}
              {filters.training_type && (
                <Badge variant="secondary" className="gap-1">
                  Type: {filters.training_type}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('training_type')}
                  />
                </Badge>
              )}
              {filters.year && (
                <Badge variant="secondary" className="gap-1">
                  Year: {filters.year}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('year')}
                  />
                </Badge>
              )}
              {filters.certificate_issued !== undefined && (
                <Badge variant="secondary" className="gap-1">
                  Certificate: {filters.certificate_issued ? 'Yes' : 'No'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter('certificate_issued')}
                  />
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by training title, employee name, or organizer..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Employee Filter */}
              {showEmployeeFilter && (
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select
                    value={filters.employee_id?.toString() || 'all'}
                    onValueChange={(value) => handleFilterChange('employee_id', value && value !== 'all' ? parseInt(value) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All employees</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{`${employee.first_name} ${employee.last_name}`}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Training Program Filter */}
              <div className="space-y-2">
                <Label>Training Program</Label>
                <Select
                  value={filters.training_program_id?.toString() || 'all'}
                  onValueChange={(value) => handleFilterChange('training_program_id', value && value !== 'all' ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All programs</SelectItem>
                    {trainingPrograms.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          <span>{program.title}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Training Type Filter */}
              <div className="space-y-2">
                <Label>Training Type</Label>
                <Select
                  value={filters.training_type || 'all'}
                  onValueChange={(value) => handleFilterChange('training_type', value && value !== 'all' ? value : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {trainingTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <Label>Year</Label>
                <Select
                  value={filters.year?.toString() || 'all'}
                  onValueChange={(value) => handleFilterChange('year', value && value !== 'all' ? parseInt(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filters */}
              <div className="space-y-2">
                <Label>Start Date (From)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.start_date ? format(new Date(filters.start_date), 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.start_date ? new Date(filters.start_date) : undefined}
                      onSelect={(date) => handleFilterChange('start_date', date?.toISOString().split('T')[0])}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date (To)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.end_date ? format(new Date(filters.end_date), 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.end_date ? new Date(filters.end_date) : undefined}
                      onSelect={(date) => handleFilterChange('end_date', date?.toISOString().split('T')[0])}
                      disabled={(date) => 
                        filters.start_date ? date < new Date(filters.start_date) : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Certificate Filter */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="certificate-filter">Certificate Issued Only</Label>
              <Switch
                id="certificate-filter"
                checked={filters.certificate_issued === true}
                onCheckedChange={(checked) => 
                  handleFilterChange('certificate_issued', checked ? true : undefined)
                }
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default TrainingFiltersComponent;