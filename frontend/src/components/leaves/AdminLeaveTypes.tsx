import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';
import leaveService from '@/services/leaveService';
import { toast } from 'sonner';
import type { LeaveType } from '@/types/leave';

const AdminLeaveTypes: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    max_days_per_year: '',
    is_monetizable: false,
    requires_medical_certificate: false,
    max_consecutive_days: '',
    min_days_notice: ''
  });

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      setIsLoading(true);
      const data = await leaveService.getLeaveTypes();
      setLeaveTypes(data);
    } catch (error) {
      toast.error('Failed to load leave types');
      console.error('Error loading leave types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        description: formData.description || undefined,
        max_days_per_year: formData.max_days_per_year ? parseInt(formData.max_days_per_year) : undefined,
        is_monetizable: formData.is_monetizable,
        requires_medical_certificate: formData.requires_medical_certificate,
        max_consecutive_days: formData.max_consecutive_days ? parseInt(formData.max_consecutive_days) : undefined,
        min_days_notice: formData.min_days_notice ? parseInt(formData.min_days_notice) : undefined,
      };

      if (editingType) {
        await leaveService.updateLeaveType(editingType.id, payload);
        toast.success('Leave type updated successfully');
      } else {
        await leaveService.createLeaveType(payload);
        toast.success('Leave type created successfully');
      }

      resetForm();
      loadLeaveTypes();
    } catch {
      toast.error('Failed to save leave type');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      max_days_per_year: '',
      is_monetizable: false,
      requires_medical_certificate: false,
      max_consecutive_days: '',
      min_days_notice: ''
    });
    setEditingType(null);
    setShowAddDialog(false);
  };

  const handleEdit = (leaveType: LeaveType) => {
    setFormData({
      name: leaveType.name,
      code: leaveType.code,
      description: leaveType.description || '',
      max_days_per_year: leaveType.max_days_per_year?.toString() || '',
      is_monetizable: leaveType.is_monetizable,
      requires_medical_certificate: leaveType.requires_medical_certificate,
      max_consecutive_days: leaveType.max_consecutive_days?.toString() || '',
      min_days_notice: leaveType.min_days_notice?.toString() || ''
    });
    setEditingType(leaveType);
    setShowAddDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading leave types...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Leave Types Management</span>
            </CardTitle>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Leave Type
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingType ? 'Edit Leave Type' : 'Add New Leave Type'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Vacation Leave"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g., VL"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description of the leave type"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_days_per_year">Max Days Per Year</Label>
                      <Input
                        id="max_days_per_year"
                        type="number"
                        value={formData.max_days_per_year}
                        onChange={(e) => setFormData({ ...formData, max_days_per_year: e.target.value })}
                        placeholder="e.g., 15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_consecutive_days">Max Consecutive Days</Label>
                      <Input
                        id="max_consecutive_days"
                        type="number"
                        value={formData.max_consecutive_days}
                        onChange={(e) => setFormData({ ...formData, max_consecutive_days: e.target.value })}
                        placeholder="e.g., 5"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_days_notice">Minimum Days Notice</Label>
                    <Input
                      id="min_days_notice"
                      type="number"
                      value={formData.min_days_notice}
                      onChange={(e) => setFormData({ ...formData, min_days_notice: e.target.value })}
                      placeholder="e.g., 3"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Monetizable</Label>
                        <p className="text-sm text-muted-foreground">Can unused days be converted to cash?</p>
                      </div>
                      <Switch
                        checked={formData.is_monetizable}
                        onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_monetizable: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Requires Medical Certificate</Label>
                        <p className="text-sm text-muted-foreground">Medical certificate required for this leave type?</p>
                      </div>
                      <Switch
                        checked={formData.requires_medical_certificate}
                        onCheckedChange={(checked: boolean) => setFormData({ ...formData, requires_medical_certificate: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" className="flex-1">
                      {editingType ? 'Update' : 'Create'} Leave Type
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configure different types of leave available to employees.
          </p>
        </CardContent>
      </Card>

      {/* Leave Types List */}
      {leaveTypes.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Leave Types</h3>
              <p>Create your first leave type to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leaveTypes.map((leaveType) => (
            <Card key={leaveType.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{leaveType.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(leaveType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Badge variant="outline">{leaveType.code}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaveType.description && (
                  <p className="text-sm text-muted-foreground">{leaveType.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  {leaveType.max_days_per_year && (
                    <div className="flex justify-between">
                      <span>Max days/year:</span>
                      <span className="font-medium">{leaveType.max_days_per_year}</span>
                    </div>
                  )}
                  
                  {leaveType.max_consecutive_days && (
                    <div className="flex justify-between">
                      <span>Max consecutive:</span>
                      <span className="font-medium">{leaveType.max_consecutive_days}</span>
                    </div>
                  )}
                  
                  {leaveType.min_days_notice && (
                    <div className="flex justify-between">
                      <span>Min notice:</span>
                      <span className="font-medium">{leaveType.min_days_notice} days</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {leaveType.is_monetizable && (
                    <Badge variant="secondary">Monetizable</Badge>
                  )}
                  {leaveType.requires_medical_certificate && (
                    <Badge variant="secondary">Med. Cert Required</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLeaveTypes;