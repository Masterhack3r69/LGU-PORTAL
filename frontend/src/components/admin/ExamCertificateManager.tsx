import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, Trash2, Edit2, X, Check, Award, Calendar, MapPin, Hash, CheckCircle } from 'lucide-react';
import type { ExamCertificate } from '@/types/employee';
import { dateStringToDateObject, dateObjectToDateString } from '@/utils/helpers';

interface ExamCertificateManagerProps {
  certificates?: ExamCertificate[];
  onChange: (certificates: ExamCertificate[]) => void;
  disabled?: boolean;
}

export function ExamCertificateManager({ certificates = [], onChange, disabled = false }: ExamCertificateManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<ExamCertificate>>({
    exam_name: '',
    exam_type: '',
    rating: undefined,
    date_taken: '',
    place_of_examination: '',
    license_number: '',
    validity_date: ''
  });

  const resetForm = () => {
    setFormData({
      exam_name: '',
      exam_type: '',
      rating: undefined,
      date_taken: '',
      place_of_examination: '',
      license_number: '',
      validity_date: ''
    });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    if (!formData.exam_name?.trim()) return;
    
    const newCertificate: ExamCertificate = {
      employee_id: 0, // Will be set when saving employee
      exam_name: formData.exam_name,
      exam_type: formData.exam_type || undefined,
      rating: formData.rating,
      date_taken: formData.date_taken || undefined,
      place_of_examination: formData.place_of_examination || undefined,
      license_number: formData.license_number || undefined,
      validity_date: formData.validity_date || undefined
    };
    
    onChange([...certificates, newCertificate]);
    resetForm();
  };

  const handleUpdate = () => {
    if (editingIndex === null || !formData.exam_name?.trim()) return;
    
    const updatedCertificates = [...certificates];
    updatedCertificates[editingIndex] = {
      ...updatedCertificates[editingIndex],
      exam_name: formData.exam_name,
      exam_type: formData.exam_type || undefined,
      rating: formData.rating,
      date_taken: formData.date_taken || undefined,
      place_of_examination: formData.place_of_examination || undefined,
      license_number: formData.license_number || undefined,
      validity_date: formData.validity_date || undefined
    };
    
    onChange(updatedCertificates);
    resetForm();
  };

  const handleEdit = (index: number) => {
    const cert = certificates[index];
    setFormData({
      exam_name: cert.exam_name,
      exam_type: cert.exam_type || '',
      rating: cert.rating,
      date_taken: cert.date_taken || '',
      place_of_examination: cert.place_of_examination || '',
      license_number: cert.license_number || '',
      validity_date: cert.validity_date || ''
    });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleDelete = (index: number) => {
    const updatedCertificates = certificates.filter((_, i) => i !== index);
    onChange(updatedCertificates);
  };

  const startAdding = () => {
    resetForm();
    setIsAdding(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Civil Service Eligibility
            </CardTitle>
            <CardDescription>Career Service, RA 1080 (Board/Bar), and other professional eligibilities</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {certificates.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">{certificates.length}</span>
              </div>
            )}
            {!isAdding && editingIndex === null && !disabled && (
              <Button type="button" size="sm" onClick={startAdding}>
                <Plus className="h-4 w-4 mr-2" />
                Add Eligibility
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List of existing certificates */}
        {certificates.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {certificates.map((cert, index) => (
              <div
                key={index}
                className="group relative border rounded-xl p-5 hover:shadow-md hover:border-primary/50 transition-all duration-200 bg-gradient-to-br from-background to-muted/20"
              >
                {/* Header with Icon and Title */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base leading-tight mb-1 group-hover:text-primary transition-colors">
                      {cert.exam_name}
                    </h4>
                    {cert.exam_type && (
                      <p className="text-sm text-muted-foreground">{cert.exam_type}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {cert.rating && (
                      <div className="px-2.5 py-1 bg-primary/10 rounded-lg">
                        <span className="text-sm font-bold text-primary">{cert.rating}%</span>
                      </div>
                    )}
                    {!disabled && editingIndex !== index && (
                      <div className="flex gap-1 ml-2">
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
                </div>

                {/* Details */}
                <div className="space-y-2.5 text-sm">
                  {cert.date_taken && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-foreground">
                        {new Date(cert.date_taken).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {cert.place_of_examination && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{cert.place_of_examination}</span>
                    </div>
                  )}

                  {cert.license_number && (
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Hash className="h-4 w-4 flex-shrink-0" />
                      <span className="font-mono text-xs">{cert.license_number}</span>
                    </div>
                  )}

                  {cert.validity_date && (
                    <div className="mt-3 pt-3 border-t border-dashed">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Valid date</span>
                        <span className="font-medium text-foreground">
                          {new Date(cert.validity_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form */}
        {(isAdding || editingIndex !== null) && (
          <div className="border-2 border-primary/20 rounded-xl p-5 space-y-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-base">
                {editingIndex !== null ? 'Edit Eligibility' : 'Add New Eligibility'}
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Eligibility/Exam Name *</label>
                <Input
                  placeholder="e.g., Career Service Professional, RA 1080 (Board/Bar)"
                  value={formData.exam_name}
                  onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Type/Category</label>
                <Input
                  placeholder="e.g., Professional, Sub-Professional, Board Exam"
                  value={formData.exam_type}
                  onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Rating (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="85.50"
                  value={formData.rating ?? ''}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
              
              <div>
                <DatePicker
                  id="date_taken"
                  label="Date of Examination/Conferment"
                  placeholder="Select date"
                  value={dateStringToDateObject(formData.date_taken)}
                  onChange={(date) => setFormData({ ...formData, date_taken: dateObjectToDateString(date) })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">License Number</label>
                <Input
                  placeholder="License/Certificate Number"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Place of Examination/Conferment</label>
                <Input
                  placeholder="City, Province"
                  value={formData.place_of_examination}
                  onChange={(e) => setFormData({ ...formData, place_of_examination: e.target.value })}
                />
              </div>
              
              <div>
                <DatePicker
                  id="validity_date"
                  label="Validity Date"
                  placeholder="Select validity date"
                  value={dateStringToDateObject(formData.validity_date)}
                  onChange={(date) => setFormData({ ...formData, validity_date: dateObjectToDateString(date) })}
                />
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
                disabled={!formData.exam_name?.trim()}
              >
                <Check className="h-4 w-4 mr-2" />
                {editingIndex !== null ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        )}

        {certificates.length === 0 && !isAdding && (
          <div className="text-center py-12">
            <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No civil service eligibility added yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Add Eligibility" to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
