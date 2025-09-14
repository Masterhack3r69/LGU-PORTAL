import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DocumentUpload } from '@/components/DocumentUpload';
import { User, Mail, CreditCard, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { employeeService } from '@/services/employeeService';
import { documentService } from '@/services/documentService';
import type { Employee, Document as DocumentType } from '@/types/employee';

// Helper function to format date for database submission
const formatDate = (dateString: string | undefined | null): string | undefined => {
  if (!dateString) return undefined;
  
  // If it's already in yyyy-MM-dd format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Handle ISO string or date input value
  try {
    // Parse the date - this handles ISO strings and other formats
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return undefined;
    }
    
    // Format to yyyy-MM-dd for database
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return undefined;
  }
};

// Helper function to format date for input display
const formatDateForInput = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  
  // If it's already in yyyy-MM-dd format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // If it's an ISO string or other format, convert to yyyy-MM-dd
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

export function ProfilePage() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load employee data
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!user?.employee_id) return;

      try {
        setIsLoading(true);
        const [employeeData, employeeDocuments] = await Promise.all([
          employeeService.getEmployee(user.employee_id),
          documentService.getDocuments({ employee_id: user.employee_id })
        ]);

        setEmployee(employeeData);
        // Format ALL date fields for input display when setting form data
        // Create clean data without conflicting ISO format fields
        const cleanData = { ...employeeData };
        delete cleanData.date_of_birth;
        delete cleanData.hire_date;
        
        setFormData({
          ...cleanData,
          birth_date: formatDateForInput(employeeData.birth_date),
          appointment_date: formatDateForInput(employeeData.appointment_date),
          separation_date: formatDateForInput(employeeData.separation_date)
        });
        setDocuments(employeeDocuments);
      } catch (error) {
        console.error('Failed to load employee data:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployeeData();
  }, [user?.employee_id]);

  const handleInputChange = (field: keyof Employee, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!employee?.id) return;

    try {
      setIsSaving(true);
      
      // Format ALL date fields before sending to backend
      const formattedBirthDate = formatDate(formData.birth_date);
      const formattedAppointmentDate = formatDate(formData.appointment_date);
      const formattedSeparationDate = formatDate(formData.separation_date);
      
      const formattedData = {
        ...formData,
        id: employee.id,
        birth_date: formattedBirthDate,
        appointment_date: formattedAppointmentDate,
        separation_date: formattedSeparationDate,
        // Remove conflicting fields that contain ISO format
        date_of_birth: undefined,
        hire_date: undefined
      };
      
      const updatedEmployee = await employeeService.updateEmployee(employee.id, formattedData);
      setEmployee(updatedEmployee);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (employee) {
      // Create clean data without conflicting ISO format fields
      const cleanData = { ...employee };
      delete cleanData.date_of_birth;
      delete cleanData.hire_date;
      
      setFormData({
        ...cleanData,
        birth_date: formatDateForInput(employee.birth_date),
        appointment_date: formatDateForInput(employee.appointment_date),
        separation_date: formatDateForInput(employee.separation_date)
      });
    }
    setIsEditing(false);
  };

  const refreshDocuments = async () => {
    if (!user?.employee_id) return;
    try {
      const employeeDocuments = await documentService.getDocuments({ employee_id: user.employee_id });
      setDocuments(employeeDocuments);
    } catch (error) {
      console.error('Failed to refresh documents:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Unable to load profile data</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and documents
          </p>
        </div>
        <Badge variant={employee.employment_status === 'Active' ? 'default' : 'secondary'}>
          {employee.employment_status}
        </Badge>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal & Contact Information</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Your basic personal details
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edit</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Employee Status Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Employee Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_number">Employee Number</Label>
                    <Input
                      id="employee_number"
                      value={employee.employee_number}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employment_status">Employment Status</Label>
                    <Input
                      id="employment_status"
                      value={employee.employment_status}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middle_name">Middle Name</Label>
                    <Input
                      id="middle_name"
                      value={formData.middle_name || ''}
                      onChange={(e) => handleInputChange('middle_name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="suffix">Suffix</Label>
                    <Input
                      id="suffix"
                      value={formData.suffix || ''}
                      onChange={(e) => handleInputChange('suffix', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Jr., Sr., III, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Gender</Label>
                    <Select
                      value={formData.sex || ''}
                      onValueChange={(value) => handleInputChange('sex', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="civil_status">Civil Status</Label>
                    <Select
                      value={formData.civil_status || ''}
                      onValueChange={(value) => handleInputChange('civil_status', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Separated">Separated</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Date of Birth</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date || ''}
                      onChange={(e) => handleInputChange('birth_date', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_place">Place of Birth</Label>
                    <Input
                      id="birth_place"
                      value={formData.birth_place || ''}
                      onChange={(e) => handleInputChange('birth_place', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                How to reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email_address">Email Address</Label>
                  <Input
                    id="email_address"
                    type="email"
                    value={formData.email_address || ''}
                    onChange={(e) => handleInputChange('email_address', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_number">Contact Number</Label>
                  <Input
                    id="contact_number"
                    value={formData.contact_number || ''}
                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_address">Current Address</Label>
                <Textarea
                  id="current_address"
                  value={formData.current_address || ''}
                  onChange={(e) => handleInputChange('current_address', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permanent_address">Permanent Address</Label>
                <Textarea
                  id="permanent_address"
                  value={formData.permanent_address || ''}
                  onChange={(e) => handleInputChange('permanent_address', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Government IDs Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Government IDs
              </CardTitle>
              <CardDescription>
                Your government identification numbers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tin">TIN</Label>
                  <Input
                    id="tin"
                    value={formData.tin || ''}
                    onChange={(e) => handleInputChange('tin', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sss_number">SSS Number</Label>
                  <Input
                    id="sss_number"
                    value={formData.sss_number || ''}
                    onChange={(e) => handleInputChange('sss_number', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="philhealth_number">PhilHealth Number</Label>
                  <Input
                    id="philhealth_number"
                    value={formData.philhealth_number || ''}
                    onChange={(e) => handleInputChange('philhealth_number', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pagibig_number">Pag-IBIG Number</Label>
                  <Input
                    id="pagibig_number"
                    value={formData.pagibig_number || ''}
                    onChange={(e) => handleInputChange('pagibig_number', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gsis_number">GSIS Number</Label>
                <Input
                  id="gsis_number"
                  value={formData.gsis_number || ''}
                  onChange={(e) => handleInputChange('gsis_number', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentUpload
            employeeId={employee.id}
            documents={documents}
            onDocumentUploaded={refreshDocuments}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}