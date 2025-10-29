import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { employeeService } from '@/services/employeeService';
import { documentService } from '@/services/documentService';
import { examCertificateService } from '@/services/examCertificateService';
import type { Employee, EmployeeFilters, Document, ExamCertificate } from '@/types/employee';
import { Plus, Search, Eye, Edit, Trash2, FileText, MoreHorizontal, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { showToast } from "@/lib/toast";

interface EmployeeViewDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EmployeeViewDialog({ employee, open, onOpenChange }: EmployeeViewDialogProps) {
  const [examCertificates, setExamCertificates] = useState<ExamCertificate[]>([]);
  const [isLoadingCerts, setIsLoadingCerts] = useState(false);

  useEffect(() => {
    const fetchExamCertificates = async () => {
      if (!employee?.id || !open) return;
      
      try {
        setIsLoadingCerts(true);
        const certs = await examCertificateService.getExamCertificatesByEmployee(employee.id);
        setExamCertificates(certs || []);
      } catch (error) {
        console.error('Failed to fetch exam certificates:', error);
        setExamCertificates([]);
      } finally {
        setIsLoadingCerts(false);
      }
    };

    fetchExamCertificates();
  }, [employee?.id, open]);

  if (!employee) return null;

  const InfoField = ({ label, value, className = "" }: { label: string; value: string | number | null | undefined; className?: string }) => (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      <p className="text-sm mt-1">{value || 'N/A'}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                {employee.first_name} {employee.middle_name} {employee.last_name} {employee.suffix}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {employee.employee_number} • {employee.plantilla_position || 'No Position'}
              </DialogDescription>
            </div>
            <Badge className={employee.employment_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {employee.employment_status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* I. Personal Information */}
          <Card>
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-sm font-semibold">I. PERSONAL INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoField label="Gender" value={employee.sex} />
                <InfoField label="Birth Date" value={employee.birth_date ? new Date(employee.birth_date).toLocaleDateString() : null} />
                <InfoField label="Birth Place" value={employee.birth_place} />
                <InfoField label="Civil Status" value={employee.civil_status} />
                <InfoField label="Height" value={employee.height ? `${employee.height} m` : null} />
                <InfoField label="Weight" value={employee.weight ? `${employee.weight} kg` : null} />
                <InfoField label="Blood Type" value={employee.blood_type} />
                <InfoField label="Citizenship" value={employee.citizenship} />
                {employee.dual_citizenship_country && (
                  <InfoField label="Dual Citizenship" value={employee.dual_citizenship_country} className="md:col-span-2" />
                )}
                <InfoField label="Email" value={employee.email_address} className="md:col-span-2" />
                <InfoField label="Telephone" value={employee.telephone_no} />
                <InfoField label="Mobile" value={employee.mobile_no} />
              </div>
            </CardContent>
          </Card>

          {/* Residential Address */}
          <Card>
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-sm font-semibold">RESIDENTIAL ADDRESS</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoField label="House/Block/Lot No." value={employee.residential_house_no} />
                <InfoField label="Street" value={employee.residential_street} />
                <InfoField label="Subdivision/Village" value={employee.residential_subdivision} />
                <InfoField label="Barangay" value={employee.residential_barangay} />
                <InfoField label="City/Municipality" value={employee.residential_city} />
                <InfoField label="Province" value={employee.residential_province} />
                <InfoField label="ZIP Code" value={employee.residential_zipcode} />
              </div>
            </CardContent>
          </Card>

          {/* Permanent Address */}
          <Card>
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-sm font-semibold">PERMANENT ADDRESS</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoField label="House/Block/Lot No." value={employee.permanent_house_no} />
                <InfoField label="Street" value={employee.permanent_street} />
                <InfoField label="Subdivision/Village" value={employee.permanent_subdivision} />
                <InfoField label="Barangay" value={employee.permanent_barangay} />
                <InfoField label="City/Municipality" value={employee.permanent_city} />
                <InfoField label="Province" value={employee.permanent_province} />
                <InfoField label="ZIP Code" value={employee.permanent_zipcode} />
              </div>
            </CardContent>
          </Card>

          {/* Government IDs */}
          <Card>
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-sm font-semibold">GOVERNMENT IDs</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoField label="TIN" value={employee.tin} />
                <InfoField label="GSIS Number" value={employee.gsis_number} />
                <InfoField label="Pag-IBIG Number" value={employee.pagibig_number} />
                <InfoField label="PhilHealth Number" value={employee.philhealth_number} />
                <InfoField label="SSS Number" value={employee.sss_number} />
                <InfoField label="UMID ID" value={employee.umid_id_no} />
                <InfoField label="PhilSys Number" value={employee.philsys_number} />
                <InfoField label="Agency Employee No." value={employee.agency_employee_no} />
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-sm font-semibold">EMPLOYMENT INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoField label="Position" value={employee.plantilla_position} className="md:col-span-2" />
                <InfoField label="Department" value={employee.department} className="md:col-span-2" />
                <InfoField label="Plantilla Number" value={employee.plantilla_number} />
                <InfoField label="Appointment Date" value={employee.appointment_date ? new Date(employee.appointment_date).toLocaleDateString() : null} />
                <InfoField label="Salary Grade" value={employee.salary_grade} />
                <InfoField label="Step Increment" value={employee.step_increment} />
                <InfoField label="Monthly Salary" value={employee.current_monthly_salary ? `₱${employee.current_monthly_salary.toLocaleString()}` : null} />
                <InfoField label="Daily Rate" value={employee.current_daily_rate ? `₱${employee.current_daily_rate.toLocaleString()}` : null} />
              </div>
            </CardContent>
          </Card>

          {/* IV. Civil Service Eligibility */}
          <Card>
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-sm font-semibold">IV. CIVIL SERVICE ELIGIBILITY</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoadingCerts ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Loading eligibility records...
                </div>
              ) : examCertificates.length > 0 ? (
                <div className="space-y-3">
                  {examCertificates.map((cert, index) => (
                    <div key={cert.id || index} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase">Eligibility/Exam Name</label>
                          <p className="font-medium mt-1">{cert.exam_name}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase">Rating</label>
                          <p className="mt-1">{cert.rating ? `${cert.rating}%` : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase">Date of Exam/Conferment</label>
                          <p className="mt-1">{cert.date_taken ? new Date(cert.date_taken).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase">Place</label>
                          <p className="mt-1">{cert.place_of_examination || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase">License Number</label>
                          <p className="mt-1">{cert.license_number || 'N/A'}</p>
                        </div>
                        {cert.validity_date && (
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase">Validity Date</label>
                            <p className="mt-1">{new Date(cert.validity_date).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No civil service eligibility records found
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link to={`/employees/${employee.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Employee
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DocumentsDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DocumentsDialog({ employee, open, onOpenChange }: DocumentsDialogProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<import('@/types/employee').DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    document_type_id: '',
    description: '',
    file: null as File | null,
  });
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!employee?.id || !open) return;
      
      try {
        setIsLoading(true);
        const [docs, types] = await Promise.all([
          documentService.getDocuments({ employee_id: employee.id }),
          documentService.getDocumentTypes()
        ]);
        setDocuments(docs);
        setDocumentTypes(types);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        showToast.error('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [employee?.id, open]);

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      showToast.success('Document deleted successfully');
    } catch (error) {
      console.error('Failed to delete document:', error);
      showToast.error('Failed to delete document');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file if document type is selected
      if (uploadData.document_type_id) {
        const documentType = documentTypes.find(dt => dt.id.toString() === uploadData.document_type_id);
        if (documentType) {
          const validation = documentService.validateFile(file, documentType);
          if (!validation.isValid) {
            showToast.error(validation.error || 'Invalid type selected');
            e.target.value = ''; // Clear the input
            return;
          }
        }
      }
      setUploadData(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!employee?.id || !uploadData.file || !uploadData.document_type_id) {
      showToast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsUploading(true);
      const result = await documentService.uploadDocument({
        employee_id: employee.id,
        document_type_id: parseInt(uploadData.document_type_id),
        description: uploadData.description,
        file: uploadData.file,
      });
      
      // Add the new document to the list
      setDocuments(prev => [result.data, ...prev]);
      
      // Reset form
      setUploadData({
        document_type_id: '',
        description: '',
        file: null,
      });
      setShowUploadForm(false);
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      showToast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Failed to upload document:', error);
      showToast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      await documentService.downloadDocument(document.id, document.file_name);
    } catch (error) {
      console.error('Failed to download document:', error);
      showToast.error('Failed to download document');
    }
  };

  if (!employee) return null;

  return (
   <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[80vh] overflow-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Employee Documents</DialogTitle>
          <DialogDescription>
            Documents for {employee.first_name} {employee.last_name} (ID: {employee.employee_number})
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Upload Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row items-end justify-end gap-4 sm:gap-0 mb-4">
              <Button
                onClick={() => setShowUploadForm(!showUploadForm)}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Upload Document
              </Button>
            </div>

            {showUploadForm && (
              <Card className="p-4 mb-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className='grid gap-2'>
                      <Label htmlFor="document-type">Document Type *</Label>
                      <Select
                        value={uploadData.document_type_id}
                        onValueChange={(value) => setUploadData(prev => ({ ...prev, document_type_id: value }))}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                              {type.is_required && <span className="text-red-500 ml-1">*</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='grid gap-2'>
                      <Label htmlFor="file-input">File *</Label>
                      <Input
                        id="file-input"
                        type="file"
                        onChange={handleFileChange}
                        accept={uploadData.document_type_id ?
                          documentTypes.find(dt => dt.id.toString() === uploadData.document_type_id)?.allowed_extensions.map(ext => `.${ext}`).join(',')
                          : undefined
                        }
                      />
                    </div>
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Enter document description (optional)"
                      value={uploadData.description}
                      onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  {uploadData.file && uploadData.document_type_id && (
                    <div className="text-sm text-muted-foreground">
                      <p>File: {uploadData.file.name}</p>
                      <p>Size: {(uploadData.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      {(() => {
                        const documentType = documentTypes.find(dt => dt.id.toString() === uploadData.document_type_id);
                        if (documentType) {
                          const validation = documentService.validateFile(uploadData.file!, documentType);
                          return (
                            <p className={validation.isValid ? 'text-green-600' : 'text-red-600'}>
                              {validation.isValid ? '✓ File is valid' : `✗ ${validation.error}`}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={handleUpload}
                      disabled={!uploadData.file || !uploadData.document_type_id || isUploading}
                      className="flex-1"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Document'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowUploadForm(false);
                        setUploadData({ document_type_id: '', description: '', file: null });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Responsive Documents List */}
          {isLoading ? (
            <div className="text-center py-8">Loading documents...</div>
          ) : documents.length > 0 ? (
            <>
              {/* Table for larger screens */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium max-w-0">
                          <div className="truncate" title={document.file_name}>
                            {document.file_name}
                          </div>
                        </TableCell>
                        <TableCell>{document.document_type_name || 'N/A'}</TableCell>
                        <TableCell>
                          {document.upload_date ? new Date(document.upload_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {document.file_size ? `${(document.file_size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              document.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                document.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {document.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(document)}
                              title="Download"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteDocument(document.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cards for mobile screens */}
              <div className="md:hidden space-y-4">
                {documents.map((document) => (
                  <Card key={document.id} className="p-4">
                    {/* Container for the document details */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Document Name</div>
                      <div className="truncate" title={document.file_name}>
                        {document.file_name}
                      </div>
                      <div className="font-medium">Type</div>
                      <div>{document.document_type_name || 'N/A'}</div>
                      <div className="font-medium">Upload Date</div>
                      <div>
                        {document.upload_date ? new Date(document.upload_date).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="font-medium">Size</div>
                      <div>
                        {document.file_size ? `${(document.file_size / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}
                      </div>
                      <div className="font-medium">Status</div>
                      <div>
                        <Badge
                          className={
                            document.status === 'Approved' ? 'bg-green-100 text-green-800' :
                              document.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {document.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Container for the action buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(document)}
                        title="Download"
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-red-600 hover:text-red-700 flex-1"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents found for this employee</p>
              <p className="text-sm">Click "Upload Document" to add the first document</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Local search state
  const [positionTerm, setPositionTerm] = useState(''); // Local position search state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false); // Collapsible state for filters
  const [filters, setFilters] = useState<EmployeeFilters>({
    name: '',
    department: searchParams.get('department') || '',
    position: '',
    status: '',
    page: 1,
    limit: 1000, // Fetch up to 1000 emp
  });
  const [total, setTotal] = useState(0);

  // Update filters when URL department parameter changes
  useEffect(() => {
    const deptParam = searchParams.get('department') || '';
    setFilters(prev => {
      // Only update if department actually changed
      if (prev.department !== deptParam) {
        return { ...prev, department: deptParam, page: 1 };
      }
      return prev;
    });
  }, [searchParams]);

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await employeeService.getEmployees(filters);
      setEmployees(response.employees);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      showToast.error('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Debounced search effect for name
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== filters.name) {
        setFilters(prev => ({ ...prev, name: searchTerm, page: 1 }));
      }
    }, 800); // 800ms delay for better UX

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filters.name]);

  // Debounced search effect for position
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (positionTerm !== filters.position) {
        setFilters(prev => ({ ...prev, position: positionTerm, page: 1 }));
      }
    }, 800); // 800ms delay for better UX

    return () => clearTimeout(debounceTimer);
  }, [positionTerm, filters.position]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'Resigned':
        return <Badge className="bg-blue-100 text-blue-800">Resigned</Badge>;
      case 'Retired':
        return <Badge className="bg-purple-100 text-purple-800">Retired</Badge>;
      case 'Terminated':
        return <Badge className="bg-red-100 text-red-800">Terminated</Badge>;
      case 'AWOL':
        return <Badge className="bg-orange-100 text-orange-800">AWOL</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleFilterChange = (key: keyof EmployeeFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      await employeeService.deleteEmployee(employeeId);
      showToast.success('Employee deleted successfully');
      fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      showToast.error('Failed to delete employee');
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewDialogOpen(true);
  };

  const handleViewDocuments = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDocumentsDialogOpen(true);
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Employees</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your organization's employees
            </p>
          </div>
          <Button asChild>
            <Link to="/employees/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>
            Total: {total} employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6">
            {/* Mobile Filter Toggle */}
            <div className="md:hidden mb-4">
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters & Search
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                      isFiltersOpen ? 'rotate-180' : ''
                    }`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-full"
                      />
                    </div>
                    <Input
                      placeholder="Position"
                      value={positionTerm}
                      onChange={(e) => setPositionTerm(e.target.value)}
                      className="w-full"
                    />
                    <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Resigned">Resigned</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                        <SelectItem value="Terminated">Terminated</SelectItem>
                        <SelectItem value="AWOL">AWOL</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={fetchEmployees} className="w-full">
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:flex flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>
              </div>
              <Input
                placeholder="Position"
                value={positionTerm}
                onChange={(e) => setPositionTerm(e.target.value)}
                className="w-[180px]"
              />
              <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Resigned">Resigned</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                  <SelectItem value="Terminated">Terminated</SelectItem>
                  <SelectItem value="AWOL">AWOL</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchEmployees}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Employee Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.employee_number}</TableCell>
                      <TableCell>
                        {employee.first_name} {employee.last_name}
                      </TableCell>
                      <TableCell>{employee.plantilla_position || 'N/A'}</TableCell>
                      <TableCell>{employee.department || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(employee.employment_status)}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleViewEmployee(employee)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/employees/${employee.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Employee
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewDocuments(employee)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Documents
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No employees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Total Count */}
          <div className="flex items-center justify-end mt-4">
            <div className="text-sm text-muted-foreground">
              Total: {total} employees
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EmployeeViewDialog
        employee={selectedEmployee}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
      <DocumentsDialog
        employee={selectedEmployee}
        open={documentsDialogOpen}
        onOpenChange={setDocumentsDialogOpen}
      />
    </div>
  );
}