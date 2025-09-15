import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, CheckCircle, X, Clock, AlertCircle, Eye, Search, RefreshCw } from 'lucide-react';
import { documentService } from '@/services/documentService';
import type { Document, DocumentType, DocumentStatistics } from '@/types/employee';

export function DocumentManagementPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [statistics, setStatistics] = useState<DocumentStatistics | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    document_type_id: 'all',
    employee_search: ''
  });
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [docsResult, typesResult, statsResult] = await Promise.all([
        documentService.getDocuments({
          ...(filters.status !== 'all' && { status: filters.status as 'Pending' | 'Approved' | 'Rejected' }),
          ...(filters.document_type_id !== 'all' && { document_type_id: parseInt(filters.document_type_id) }),
          limit: 100
        }),
        documentService.getDocumentTypes(),
        documentService.getDocumentStatistics()
      ]);

      let filteredDocs = docsResult;
      if (filters.employee_search) {
        filteredDocs = docsResult.filter(doc => 
          doc.employee_name?.toLowerCase().includes(filters.employee_search.toLowerCase()) ||
          doc.employee_number?.toLowerCase().includes(filters.employee_search.toLowerCase())
        );
      }

      setDocuments(filteredDocs);
      setDocumentTypes(typesResult);
      setStatistics(statsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: 'Failed to load document data' });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReview = (document: Document) => {
    setSelectedDocument(document);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedDocument) return;

    try {
      setIsReviewing(true);
      await documentService.approveDocument(selectedDocument.id, reviewNotes);
      setMessage({ type: 'success', text: 'Document approved successfully' });
      setReviewDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to approve document:', error);
      setMessage({ type: 'error', text: 'Failed to approve document' });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDocument || !reviewNotes.trim()) {
      setMessage({ type: 'error', text: 'Review notes are required when rejecting a document' });
      return;
    }

    try {
      setIsReviewing(true);
      await documentService.rejectDocument(selectedDocument.id, reviewNotes);
      setMessage({ type: 'success', text: 'Document rejected successfully' });
      setReviewDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to reject document:', error);
      setMessage({ type: 'error', text: 'Failed to reject document' });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      await documentService.downloadDocument(document.id, document.file_name);
    } catch (error) {
      console.error('Download failed:', error);
      setMessage({ type: 'error', text: 'Failed to download document' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPendingDocuments = () => documents.filter(doc => doc.status === 'Pending');
  const getApprovedDocuments = () => documents.filter(doc => doc.status === 'Approved');
  const getRejectedDocuments = () => documents.filter(doc => doc.status === 'Rejected');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loading document management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
            <p className="text-muted-foreground">
              Review and manage employee document submissions
            </p>
          </div>
        </div>
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

      {/* Statistics Cards */}
      {statistics && (
       <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Documents Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{statistics.total}</div>
            </CardContent>
          </Card>

          {/* Pending Review Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">{statistics.pending}</div>
            </CardContent>
          </Card>

          {/* Approved Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-5w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">{statistics.approved}</div>
            </CardContent>
          </Card>

          {/* Rejected Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <X className="h-5 w-5 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600 dark:text-red-400">{statistics.rejected}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        {/* <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader> */}
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2 flex-1">
              <div className="relative ">
                <Search className=" absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="employee-search"
                  placeholder="Search by name or employee number..."
                  value={filters.employee_search}
                  onChange={(e) => setFilters({...filters, employee_search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Select value={filters.document_type_id} onValueChange={(value) => setFilters({...filters, document_type_id: value})}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
             <div className="space-y-2 ">
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger >
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={loadData}
              disabled={isLoading}
              className="w-[100px]"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Review
            {getPendingDocuments().length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {getPendingDocuments().length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <DocumentTable 
            documents={getPendingDocuments()} 
            onReview={handleReview}
            onDownload={handleDownload}
            showReviewActions={true}
          />
        </TabsContent>

        <TabsContent value="approved">
          <DocumentTable 
            documents={getApprovedDocuments()} 
            onDownload={handleDownload}
            showReviewActions={false}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <DocumentTable 
            documents={getRejectedDocuments()} 
            onDownload={handleDownload}
            showReviewActions={false}
          />
        </TabsContent>

        <TabsContent value="all">
          <DocumentTable 
            documents={documents} 
            onReview={handleReview}
            onDownload={handleDownload}
            showReviewActions={true}
          />
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
            <DialogDescription>
              Review and approve or reject this document submission
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-semibold">Employee:</Label>
                  <p>{selectedDocument.employee_name} ({selectedDocument.employee_number})</p>
                </div>
                <div>
                  <Label className="font-semibold">Document Type:</Label>
                  <p>{selectedDocument.document_type_name}</p>
                </div>
                <div>
                  <Label className="font-semibold">File Name:</Label>
                  <p>{selectedDocument.file_name}</p>
                </div>
                <div>
                  <Label className="font-semibold">File Size:</Label>
                  <p>{formatFileSize(selectedDocument.file_size)}</p>
                </div>
              </div>

              {selectedDocument.description && (
                <div>
                  <Label className="font-semibold">Description:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedDocument.description}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your review decision..."
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedDocument)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download & Review
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isReviewing}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {isReviewing ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={isReviewing}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isReviewing ? 'Approving...' : 'Approve'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Document Table Component
interface DocumentTableProps {
  documents: Document[];
  onReview?: (document: Document) => void;
  onDownload: (document: Document) => void;
  showReviewActions: boolean;
}

function DocumentTable({ documents, onReview, onDownload, showReviewActions }: DocumentTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 mb-4 text-gray-400" />
          <p className="text-muted-foreground">No documents found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{document.employee_name || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">{document.employee_number}</div>
                  </div>
                </TableCell>
                <TableCell>{document.document_type_name || 'Unknown'}</TableCell>
                <TableCell className="font-medium">{document.file_name}</TableCell>
                <TableCell>{formatFileSize(document.file_size)}</TableCell>
                <TableCell>{getStatusBadge(document.status)}</TableCell>
                <TableCell>
                  {document.upload_date ? new Date(document.upload_date).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownload(document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {showReviewActions && document.status === 'Pending' && onReview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReview(document)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}