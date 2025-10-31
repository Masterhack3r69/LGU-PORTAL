import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit2, X, Check, GraduationCap, Calendar, MapPin, Award } from 'lucide-react';
import { dateStringToDateObject, dateObjectToDateString } from '@/utils/helpers';

interface TrainingRecord {
  id?: number;
  employee_id?: number;
  training_title: string;
  start_date?: string;
  end_date?: string;
  duration_hours?: number;
  venue?: string;
  organizer?: string;
  training_type?: string;
  certificate_issued?: boolean;
  certificate_number?: string;
}

interface TrainingProgramMiniManagerProps {
  trainings?: TrainingRecord[];
  onChange: (trainings: TrainingRecord[]) => void;
  disabled?: boolean;
}

export function TrainingProgramMiniManager({ trainings = [], onChange, disabled = false }: TrainingProgramMiniManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<TrainingRecord>>({
    training_title: '',
    start_date: '',
    end_date: '',
    duration_hours: undefined,
    venue: '',
    organizer: '',
    training_type: 'Seminar',
    certificate_issued: false,
    certificate_number: ''
  });

  const resetForm = () => {
    setFormData({
      training_title: '',
      start_date: '',
      end_date: '',
      duration_hours: undefined,
      venue: '',
      organizer: '',
      training_type: 'Seminar',
      certificate_issued: false,
      certificate_number: ''
    });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    if (!formData.training_title?.trim()) return;
    
    const newTraining: TrainingRecord = {
      employee_id: 0,
      training_title: formData.training_title,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      duration_hours: formData.duration_hours,
      venue: formData.venue || undefined,
      organizer: formData.organizer || undefined,
      training_type: formData.training_type || 'Seminar',
      certificate_issued: formData.certificate_issued || false,
      certificate_number: formData.certificate_number || undefined
    };
    
    onChange([...trainings, newTraining]);
    resetForm();
  };

  const handleUpdate = () => {
    if (editingIndex === null || !formData.training_title?.trim()) return;
    
    const updatedTrainings = [...trainings];
    updatedTrainings[editingIndex] = {
      ...updatedTrainings[editingIndex],
      training_title: formData.training_title,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      duration_hours: formData.duration_hours,
      venue: formData.venue || undefined,
      organizer: formData.organizer || undefined,
      training_type: formData.training_type || 'Seminar',
      certificate_issued: formData.certificate_issued || false,
      certificate_number: formData.certificate_number || undefined
    };
    
    onChange(updatedTrainings);
    resetForm();
  };

  const handleEdit = (index: number) => {
    const training = trainings[index];
    setFormData({
      training_title: training.training_title,
      start_date: training.start_date || '',
      end_date: training.end_date || '',
      duration_hours: training.duration_hours,
      venue: training.venue || '',
      organizer: training.organizer || '',
      training_type: training.training_type || 'Seminar',
      certificate_issued: training.certificate_issued || false,
      certificate_number: training.certificate_number || ''
    });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleDelete = (index: number) => {
    const updatedTrainings = trainings.filter((_, i) => i !== index);
    onChange(updatedTrainings);
  };

  const startAdding = () => {
    resetForm();
    setIsAdding(true);
  };

  const formatDateRange = (from?: string, to?: string) => {
    if (!from && !to) return 'No dates specified';
    const fromDate = from ? new Date(from).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    const toDate = to ? new Date(to).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
    if (fromDate && toDate) return `${fromDate} - ${toDate}`;
    if (fromDate) return `From ${fromDate}`;
    if (toDate) return `Until ${toDate}`;
    return 'No dates specified';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {trainings.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
              <GraduationCap className="h-4 w-4" />
              <span className="text-sm font-medium">{trainings.length}</span>
            </div>
          )}
        </div>
        {!isAdding && editingIndex === null && !disabled && (
          <Button type="button" size="sm" onClick={startAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Training
          </Button>
        )}
      </div>

      {/* List of existing trainings */}
      {trainings.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {trainings.map((training, index) => (
            <div
              key={index}
              className="group relative border rounded-xl p-5 hover:shadow-md hover:border-primary/50 transition-all duration-200 bg-gradient-to-br from-background to-muted/20"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                        {training.training_title}
                      </h4>
                      {training.organizer && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Conducted by: {training.organizer}
                        </p>
                      )}
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
                      <span>{formatDateRange(training.start_date, training.end_date)}</span>
                    </div>

                    {training.venue && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{training.venue}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      {training.training_type && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {training.training_type}
                        </span>
                      )}
                      {training.duration_hours && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {training.duration_hours} hours
                        </span>
                      )}
                      {training.certificate_issued && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          Certificate Issued
                          {training.certificate_number && `: ${training.certificate_number}`}
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
            <GraduationCap className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-base">
              {editingIndex !== null ? 'Edit Training' : 'Add New Training'}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Training Title *</label>
              <Input
                placeholder="e.g., Leadership Development Program"
                value={formData.training_title}
                onChange={(e) => setFormData({ ...formData, training_title: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Type/Category</label>
              <Select
                value={formData.training_type}
                onValueChange={(value) => setFormData({ ...formData, training_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seminar">Seminar</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Internal">Internal Training</SelectItem>
                  <SelectItem value="External">External Training</SelectItem>
                  <SelectItem value="Online">Online Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Duration (hours)</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="8"
                value={formData.duration_hours ?? ''}
                onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            
            <div>
              <DatePicker
                id="training_start_date"
                label="Start Date"
                placeholder="Select start date"
                value={dateStringToDateObject(formData.start_date)}
                onChange={(date) => setFormData({ ...formData, start_date: dateObjectToDateString(date) })}
              />
            </div>
            
            <div>
              <DatePicker
                id="training_end_date"
                label="End Date"
                placeholder="Select end date"
                value={dateStringToDateObject(formData.end_date)}
                onChange={(date) => setFormData({ ...formData, end_date: dateObjectToDateString(date) })}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Venue</label>
              <Input
                placeholder="e.g., City Hall Conference Room"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Conducted/Sponsored By</label>
              <Input
                placeholder="e.g., Department of Interior and Local Government"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
              />
            </div>
            
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certificate_issued"
                  checked={formData.certificate_issued}
                  onCheckedChange={(checked) => setFormData({ ...formData, certificate_issued: checked as boolean })}
                />
                <label
                  htmlFor="certificate_issued"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Certificate Issued
                </label>
              </div>
              
              {formData.certificate_issued && (
                <div>
                  <label className="text-sm font-medium">Certificate Number</label>
                  <Input
                    placeholder="e.g., CERT-2024-001"
                    value={formData.certificate_number}
                    onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                  />
                </div>
              )}
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
              disabled={!formData.training_title?.trim()}
            >
              <Check className="h-4 w-4 mr-2" />
              {editingIndex !== null ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      )}

      {trainings.length === 0 && !isAdding && (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No training programs added yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add Training" to get started</p>
        </div>
      )}
    </div>
  );
}
