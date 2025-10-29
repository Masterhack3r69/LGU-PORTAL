import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit2, X, Check, Briefcase, Calendar, Building2, DollarSign } from 'lucide-react';
import { dateStringToDateObject, dateObjectToDateString } from '@/utils/helpers';

interface WorkExperience {
  id?: number;
  employee_id?: number;
  date_from?: string;
  date_to?: string;
  position_title: string;
  department_agency: string;
  monthly_salary?: number;
  salary_grade?: string;
  status_of_appointment?: string;
  is_government_service?: boolean;
}

interface WorkExperienceManagerProps {
  workExperiences?: WorkExperience[];
  onChange: (workExperiences: WorkExperience[]) => void;
  disabled?: boolean;
}

export function WorkExperienceManager({ workExperiences = [], onChange, disabled = false }: WorkExperienceManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<WorkExperience>>({
    position_title: '',
    department_agency: '',
    date_from: '',
    date_to: '',
    monthly_salary: undefined,
    salary_grade: '',
    status_of_appointment: '',
    is_government_service: false
  });

  const resetForm = () => {
    setFormData({
      position_title: '',
      department_agency: '',
      date_from: '',
      date_to: '',
      monthly_salary: undefined,
      salary_grade: '',
      status_of_appointment: '',
      is_government_service: false
    });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    if (!formData.position_title?.trim() || !formData.department_agency?.trim()) return;
    
    const newWorkExp: WorkExperience = {
      employee_id: 0,
      position_title: formData.position_title,
      department_agency: formData.department_agency,
      date_from: formData.date_from || undefined,
      date_to: formData.date_to || undefined,
      monthly_salary: formData.monthly_salary,
      salary_grade: formData.salary_grade || undefined,
      status_of_appointment: formData.status_of_appointment || undefined,
      is_government_service: formData.is_government_service || false
    };
    
    onChange([...workExperiences, newWorkExp]);
    resetForm();
  };

  const handleUpdate = () => {
    if (editingIndex === null || !formData.position_title?.trim() || !formData.department_agency?.trim()) return;
    
    const updatedWorkExps = [...workExperiences];
    updatedWorkExps[editingIndex] = {
      ...updatedWorkExps[editingIndex],
      position_title: formData.position_title,
      department_agency: formData.department_agency,
      date_from: formData.date_from || undefined,
      date_to: formData.date_to || undefined,
      monthly_salary: formData.monthly_salary,
      salary_grade: formData.salary_grade || undefined,
      status_of_appointment: formData.status_of_appointment || undefined,
      is_government_service: formData.is_government_service || false
    };
    
    onChange(updatedWorkExps);
    resetForm();
  };

  const handleEdit = (index: number) => {
    const workExp = workExperiences[index];
    setFormData({
      position_title: workExp.position_title,
      department_agency: workExp.department_agency,
      date_from: workExp.date_from || '',
      date_to: workExp.date_to || '',
      monthly_salary: workExp.monthly_salary,
      salary_grade: workExp.salary_grade || '',
      status_of_appointment: workExp.status_of_appointment || '',
      is_government_service: workExp.is_government_service || false
    });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleDelete = (index: number) => {
    const updatedWorkExps = workExperiences.filter((_, i) => i !== index);
    onChange(updatedWorkExps);
  };

  const startAdding = () => {
    resetForm();
    setIsAdding(true);
  };

  const formatDateRange = (from?: string, to?: string) => {
    if (!from && !to) return 'Present';
    const fromDate = from ? new Date(from).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
    const toDate = to ? new Date(to).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present';
    return `${fromDate} - ${toDate}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {workExperiences.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
              <Briefcase className="h-4 w-4" />
              <span className="text-sm font-medium">{workExperiences.length}</span>
            </div>
          )}
        </div>
        {!isAdding && editingIndex === null && !disabled && (
          <Button type="button" size="sm" onClick={startAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Work Experience
          </Button>
        )}
      </div>

      {/* List of existing work experiences */}
      {workExperiences.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {workExperiences.map((workExp, index) => (
            <div
              key={index}
              className="group relative border rounded-xl p-5 hover:shadow-md hover:border-primary/50 transition-all duration-200 bg-gradient-to-br from-background to-muted/20"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                        {workExp.position_title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {workExp.department_agency}
                      </p>
                    </div>
                    {!disabled && editingIndex !== index && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-destructive/10"
                          onClick={() => handleDelete(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateRange(workExp.date_from, workExp.date_to)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {workExp.is_government_service && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Government Service
                        </span>
                      )}
                      {workExp.status_of_appointment && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {workExp.status_of_appointment}
                        </span>
                      )}
                      {workExp.salary_grade && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          SG {workExp.salary_grade}
                        </span>
                      )}
                      {workExp.monthly_salary && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ₱{workExp.monthly_salary.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingIndex !== null) && (
        <div className="border-2 border-primary/20 rounded-xl p-5 space-y-4 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-base">
              {editingIndex !== null ? 'Edit Work Experience' : 'Add New Work Experience'}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Position Title *</label>
              <Input
                placeholder="e.g., Administrative Officer III"
                value={formData.position_title}
                onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Department/Agency/Office/Company *</label>
              <Input
                placeholder="e.g., Department of Education"
                value={formData.department_agency}
                onChange={(e) => setFormData({ ...formData, department_agency: e.target.value })}
              />
            </div>
            
            <div>
              <DatePicker
                id="work_date_from"
                label="From"
                placeholder="Start date"
                value={dateStringToDateObject(formData.date_from)}
                onChange={(date) => setFormData({ ...formData, date_from: dateObjectToDateString(date) })}
              />
            </div>
            
            <div>
              <DatePicker
                id="work_date_to"
                label="To"
                placeholder="End date (leave empty if current)"
                value={dateStringToDateObject(formData.date_to)}
                onChange={(date) => setFormData({ ...formData, date_to: dateObjectToDateString(date) })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Monthly Salary</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="25000.00"
                value={formData.monthly_salary ?? ''}
                onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Salary Grade/Job/Pay Grade</label>
              <Input
                placeholder="e.g., 15"
                value={formData.salary_grade}
                onChange={(e) => setFormData({ ...formData, salary_grade: e.target.value })}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Status of Appointment</label>
              <Input
                placeholder="e.g., Permanent, Temporary, Contractual"
                value={formData.status_of_appointment}
                onChange={(e) => setFormData({ ...formData, status_of_appointment: e.target.value })}
              />
            </div>
            
            <div className="md:col-span-2 flex items-center space-x-2">
              <Checkbox
                id="is_government_service"
                checked={formData.is_government_service}
                onCheckedChange={(checked) => setFormData({ ...formData, is_government_service: checked as boolean })}
              />
              <label
                htmlFor="is_government_service"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Government Service (Y/N)
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={resetForm}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={editingIndex !== null ? handleUpdate : handleAdd}
              disabled={!formData.position_title?.trim() || !formData.department_agency?.trim()}
            >
              <Check className="h-4 w-4 mr-2" />
              {editingIndex !== null ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      )}

      {workExperiences.length === 0 && !isAdding && (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No work experience added yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add Work Experience" to get started</p>
        </div>
      )}
    </div>
  );
}
