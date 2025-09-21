import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, Play, CheckCircle, Send, MoreHorizontal } from 'lucide-react';
import benefitsService from '@/services/benefitsService';
import type { BenefitCycle, BenefitType } from '@/types/benefits';

interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: string[];
  };
  statusCode: number;
  timestamp: string;
}

const BenefitCyclesManagement: React.FC = () => {
  const [benefitCycles, setBenefitCycles] = useState<BenefitCycle[]>([]);
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<BenefitCycle | null>(null);

  const [formData, setFormData] = useState<{
    benefit_type_id: string;
    cycle_year: string;
    cycle_name: string;
    applicable_date: string;
    payment_date: string;
    cutoff_date: string;
  }>({
    benefit_type_id: '',
    cycle_year: new Date().getFullYear().toString(),
    cycle_name: '',
    applicable_date: '',
    payment_date: '',
    cutoff_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cyclesResponse, typesResponse] = await Promise.all([
        benefitsService.getBenefitCycles(),
        benefitsService.getBenefitTypes()
      ]);

      if (cyclesResponse.success) {
        const data = cyclesResponse.data;
        const cyclesData = Array.isArray(data) ? data : (data as { benefit_cycles?: BenefitCycle[] })?.benefit_cycles || [];
        setBenefitCycles(cyclesData);
      } else {
        toast.error('Failed to load benefit cycles');
      }

      if (typesResponse.success) {
        const data = typesResponse.data;
        const typesData = Array.isArray(data) ? data : (data as { benefit_types?: BenefitType[] })?.benefit_types || [];
        setBenefitTypes(typesData.filter(type => type.is_active));
      } else {
        toast.error('Failed to load benefit types');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      benefit_type_id: '',
      cycle_year: new Date().getFullYear().toString(),
      cycle_name: '',
      applicable_date: '',
      payment_date: '',
      cutoff_date: ''
    });
    setEditingCycle(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (cycle: BenefitCycle) => {
    setFormData({
      benefit_type_id: cycle.benefit_type_id?.toString() || '',
      cycle_year: cycle.cycle_year?.toString() || new Date().getFullYear().toString(),
      cycle_name: cycle.cycle_name || '',
      applicable_date: cycle.applicable_date ? cycle.applicable_date.split('T')[0] : '',
      payment_date: cycle.payment_date ? cycle.payment_date.split('T')[0] : '',
      cutoff_date: cycle.cutoff_date ? cycle.cutoff_date.split('T')[0] : ''
    });
    setEditingCycle(cycle);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    // Basic form validation
    if (!formData.benefit_type_id) {
      toast.error('Please select a benefit type');
      return;
    }
    
    if (!formData.cycle_name.trim()) {
      toast.error('Please enter a cycle name');
      return;
    }
    
    if (!formData.applicable_date) {
      toast.error('Please select an applicable date');
      return;
    }
    
    // Additional validation for required fields
    const benefitTypeId = parseInt(formData.benefit_type_id);
    if (isNaN(benefitTypeId) || benefitTypeId <= 0) {
      toast.error('Please select a valid benefit type');
      return;
    }
    
    const cycleYear = parseInt(formData.cycle_year);
    if (isNaN(cycleYear) || cycleYear < 2020 || cycleYear > 2100) {
      toast.error('Please enter a valid cycle year (2020-2100)');
      return;
    }
    
    try {
      // Prepare data with proper validation
      const submitData: Partial<BenefitCycle> = {
        benefit_type_id: benefitTypeId,
        cycle_year: cycleYear,
        cycle_name: formData.cycle_name.trim(),
        applicable_date: formData.applicable_date,
        ...(formData.payment_date && { payment_date: formData.payment_date }),
        ...(formData.cutoff_date && { cutoff_date: formData.cutoff_date })
      };

      console.log('=== FRONTEND BENEFIT CYCLE DEBUG ===');
      console.log('Sending benefit cycle data:', submitData);
      console.log('Editing cycle:', editingCycle);
      console.log('Form data state:', formData);

      let response;
      if (editingCycle) {
        response = await benefitsService.updateBenefitCycle(editingCycle.id, submitData);
      } else {
        response = await benefitsService.createBenefitCycle(submitData);
      }

      if (response.success) {
        toast.success(editingCycle ? 'Benefit cycle updated successfully' : 'Benefit cycle created successfully');
        setDialogOpen(false);
        resetForm();
        loadData();
      } else {
        console.error('API Error Response:', response);
        toast.error(response.message || 'Failed to save benefit cycle');
      }
    } catch (error: unknown) {
      console.error('Failed to save benefit cycle:', error);
      const axiosError = error as AxiosError<ApiErrorResponse>;
      
      // Log full error response for debugging
      console.log('Full error response:', axiosError.response);
      
      if (axiosError.response?.data) {
        const errorData = axiosError.response.data;
        
        // Handle validation errors with detailed messages
        if (errorData.error?.details && Array.isArray(errorData.error.details) && errorData.error.details.length > 0) {
          toast.error(`Validation Error: ${errorData.error.details.join(', ')}`);
        } else if (errorData.error?.message) {
          toast.error(`Error: ${errorData.error.message}`);
        } else {
          // Try to show the raw data for debugging
          toast.error(`Failed to save benefit cycle: ${JSON.stringify(errorData, null, 2)}`);
        }
      } else if (axiosError.response?.status === 400) {
        // Check for specific validation errors
        if (axiosError.response.data?.error?.details) {
          const details = Array.isArray(axiosError.response.data.error.details)
            ? axiosError.response.data.error.details
            : [axiosError.response.data.error.details];
          toast.error(`Validation Error: ${details.join(', ')}`);
        } else {
          toast.error('Validation failed. Please check all required fields are filled correctly.');
        }
      } else if (axiosError.response?.status === 401) {
        // Handle authentication errors specifically
        toast.error('Session expired. Please log in again.');
        // Optionally redirect to login page
        // window.location.href = '/login';
      } else if (axiosError.response?.statusText) {
        toast.error(`Failed to save benefit cycle: ${axiosError.response.statusText}`);
      } else {
        toast.error('Failed to save benefit cycle. Please try again.');
      }
    }
  };

  const handleProcess = async (id: number) => {
    try {
      const response = await benefitsService.processBenefitCycle(id);
      if (response.success) {
        toast.success('Benefit cycle processing started');
        loadData();
      } else {
        toast.error('Failed to process benefit cycle');
      }
    } catch (error) {
      console.error('Failed to process benefit cycle:', error);
      toast.error('Failed to process benefit cycle');
    }
  };

  const handleFinalize = async (id: number) => {
    try {
      const response = await benefitsService.finalizeBenefitCycle(id);
      if (response.success) {
        toast.success('Benefit cycle finalized successfully');
        loadData();
      } else {
        toast.error('Failed to finalize benefit cycle');
      }
    } catch (error) {
      console.error('Failed to finalize benefit cycle:', error);
      toast.error('Failed to finalize benefit cycle');
    }
  };

  const handleRelease = async (id: number) => {
    try {
      const response = await benefitsService.releaseBenefitCycle(id);
      if (response.success) {
        toast.success('Benefit cycle released successfully');
        loadData();
      } else {
        toast.error('Failed to release benefit cycle');
      }
    } catch (error) {
      console.error('Failed to release benefit cycle:', error);
      toast.error('Failed to release benefit cycle');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await benefitsService.deleteBenefitCycle(id);
      if (response.success) {
        toast.success('Benefit cycle deleted successfully');
        loadData();
      } else {
        toast.error('Failed to delete benefit cycle');
      }
    } catch (error) {
      console.error('Failed to delete benefit cycle:', error);
      toast.error('Failed to delete benefit cycle');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
      'Draft': 'secondary',
      'Processing': 'default',
      'Completed': 'outline',
      'Released': 'default',
      'Cancelled': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const canProcess = (cycle: BenefitCycle) => cycle.status === 'Draft';
  const canFinalize = (cycle: BenefitCycle) => cycle.status === 'Processing';
  const canRelease = (cycle: BenefitCycle) => cycle.status === 'Completed';
  const canEdit = (cycle: BenefitCycle) => ['Draft', 'Processing'].includes(cycle.status);
  const canDelete = (cycle: BenefitCycle) => ['Draft', 'Cancelled'].includes(cycle.status);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading benefit cycles...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Benefit Cycles</CardTitle>
            <CardDescription>
              Create and manage benefit processing cycles
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Create Cycle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cycle Name</TableHead>
              <TableHead>Benefit Type</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Applicable Date</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {benefitCycles.map((cycle) => (
              <TableRow key={cycle.id}>
                <TableCell>
                  <div className="font-medium">{cycle.cycle_name}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {cycle.benefit_type_name || 'Unknown'}
                  </div>
                </TableCell>
                <TableCell>{cycle.cycle_year}</TableCell>
                <TableCell>{formatDate(cycle.applicable_date)}</TableCell>
                <TableCell>{formatDate(cycle.payment_date)}</TableCell>
                <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                <TableCell>{cycle.total_items || 0}</TableCell>
                <TableCell>
                  {cycle.total_amount ? new Intl.NumberFormat('en-PH', {
                    style: 'currency',
                    currency: 'PHP'
                  }).format(cycle.total_amount) : '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {canEdit(cycle) && (
                        <DropdownMenuItem onClick={() => openEditDialog(cycle)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {canProcess(cycle) && (
                        <DropdownMenuItem onClick={() => handleProcess(cycle.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          Process
                        </DropdownMenuItem>
                      )}
                      {canFinalize(cycle) && (
                        <DropdownMenuItem onClick={() => handleFinalize(cycle.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Finalize
                        </DropdownMenuItem>
                      )}
                      {canRelease(cycle) && (
                        <DropdownMenuItem onClick={() => handleRelease(cycle.id)}>
                          <Send className="mr-2 h-4 w-4" />
                          Release
                        </DropdownMenuItem>
                      )}
                      {canDelete(cycle) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <AlertDialog>
                              <AlertDialogTrigger className="flex items-center w-full cursor-pointer px-2 py-1.5 text-sm">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Benefit Cycle</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{cycle.cycle_name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(cycle.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCycle ? 'Edit Benefit Cycle' : 'Create Benefit Cycle'}
              </DialogTitle>
              <DialogDescription>
                {editingCycle
                  ? 'Update the benefit cycle details below.'
                  : 'Create a new benefit cycle for processing benefits.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="benefit_type_id">Benefit Type *</Label>
                  <Select
                    value={formData.benefit_type_id}
                    onValueChange={(value) => setFormData({ ...formData, benefit_type_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select benefit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {benefitTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cycle_year">Year *</Label>
                  <Input
                    id="cycle_year"
                    type="number"
                    value={formData.cycle_year}
                    onChange={(e) => setFormData({ ...formData, cycle_year: e.target.value })}
                    placeholder="2024"
                    min="2020"
                    max="2100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycle_name">Cycle Name *</Label>
                <Input
                  id="cycle_name"
                  value={formData.cycle_name}
                  onChange={(e) => setFormData({ ...formData, cycle_name: e.target.value })}
                  placeholder="2024 Mid-Year Bonus"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="applicable_date">Applicable Date *</Label>
                  <Input
                    id="applicable_date"
                    type="date"
                    value={formData.applicable_date}
                    onChange={(e) => setFormData({ ...formData, applicable_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Payment Date</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cutoff_date">Cutoff Date</Label>
                  <Input
                    id="cutoff_date"
                    type="date"
                    value={formData.cutoff_date}
                    onChange={(e) => setFormData({ ...formData, cutoff_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingCycle ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BenefitCyclesManagement;