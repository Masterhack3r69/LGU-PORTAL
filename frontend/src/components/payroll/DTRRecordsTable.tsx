import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';
import { showToast } from '@/lib/toast';
import dtrService, { type DTRRecordDetail } from '@/services/dtrService';

interface DTRRecordsTableProps {
  periodId: number;
  onRecordUpdate?: () => void;
}

type SortField = 'employeeNumber' | 'employeeName' | 'position' | 'workingDays' | 'importedAt' | 'status';
type SortDirection = 'asc' | 'desc' | null;

export function DTRRecordsTable({ periodId, onRecordUpdate }: DTRRecordsTableProps) {
  const [records, setRecords] = useState<DTRRecordDetail[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DTRRecordDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DTRRecordDetail | null>(null);
  const [editWorkingDays, setEditWorkingDays] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<DTRRecordDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const recordsPerPage = 50;

  useEffect(() => {
    loadRecords();
  }, [periodId]);

  useEffect(() => {
    filterAndSortRecords();
  }, [records, searchTerm, sortField, sortDirection]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await dtrService.getDTRRecords(periodId);
      console.log('DTR Records loaded:', data);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRecords(data);
      } else {
        console.error('DTR records data is not an array:', data);
        setRecords([]);
        showToast.error('Invalid Data', 'Received invalid data format from server');
      }
    } catch (error: any) {
      console.error('Failed to load DTR records:', error);
      console.error('Error details:', error.response?.data);
      showToast.error(
        'Failed to Load Records',
        error.response?.data?.error?.message || 'Could not load DTR records'
      );
      setRecords([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRecords = () => {
    // Ensure records is an array before spreading
    if (!Array.isArray(records)) {
      setFilteredRecords([]);
      return;
    }
    
    let filtered = [...records];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.employeeNumber?.toLowerCase().includes(term) ||
          record.employeeName?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        // Handle different data types
        if (sortField === 'workingDays') {
          aValue = Number(aValue);
          bValue = Number(bValue);
        } else if (sortField === 'importedAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredRecords(filtered);
    setCurrentPage(1); // Reset to first page when filtering/sorting
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 ml-1" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-1" />;
  };

  const handleEdit = (record: DTRRecordDetail) => {
    setEditingRecord(record);
    setEditWorkingDays(record.workingDays != null ? record.workingDays.toString() : '0');
    setEditNotes(record.notes || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    const workingDays = parseFloat(editWorkingDays);
    if (isNaN(workingDays) || workingDays < 0) {
      showToast.error('Invalid Input', 'Working days must be a valid non-negative number');
      return;
    }

    try {
      setIsSaving(true);
      await dtrService.updateDTRRecord(editingRecord.id, {
        workingDays,
        notes: editNotes.trim() || undefined,
      });

      showToast.success('Record Updated', 'DTR record has been updated successfully');
      setEditDialogOpen(false);
      loadRecords();
      onRecordUpdate?.();
    } catch (error: any) {
      console.error('Failed to update DTR record:', error);
      showToast.error(
        'Update Failed',
        error.response?.data?.error?.message || 'Could not update DTR record'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (record: DTRRecordDetail) => {
    setDeletingRecord(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingRecord) return;

    try {
      setIsDeleting(true);
      await dtrService.deleteDTRRecord(deletingRecord.id);

      showToast.success('Record Deleted', 'DTR record has been deleted successfully');
      setDeleteDialogOpen(false);
      loadRecords();
      onRecordUpdate?.();
    } catch (error: any) {
      console.error('Failed to delete DTR record:', error);
      showToast.error(
        'Delete Failed',
        error.response?.data?.error?.message || 'Could not delete DTR record'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'Superseded':
        return <Badge variant="secondary">Superseded</Badge>;
      case 'Deleted':
        return <Badge variant="destructive">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>DTR Records</CardTitle>
        <CardDescription>
          View and manage Daily Time Record data for this payroll period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee name or number..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort('employeeNumber')}
                  >
                    Employee Number
                    {getSortIcon('employeeNumber')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort('employeeName')}
                  >
                    Name
                    {getSortIcon('employeeName')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort('position')}
                  >
                    Position
                    {getSortIcon('position')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort('workingDays')}
                  >
                    Working Days
                    {getSortIcon('workingDays')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort('importedAt')}
                  >
                    Import Date
                    {getSortIcon('importedAt')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading DTR records...
                  </TableCell>
                </TableRow>
              ) : currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchTerm
                      ? 'No records found matching your search'
                      : 'No DTR records found for this period'}
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.employeeNumber || 'N/A'}
                    </TableCell>
                    <TableCell>{record.employeeName || 'N/A'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.position || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {record.workingDays != null ? Number(record.workingDays).toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm">
                            {record.importedAt ? dtrService.formatDate(record.importedAt) : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            by {record.importedByUsername || 'Unknown'}
                          </div>
                        </div>
                        {record.importFileName && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-1 text-xs">
                                  <div>
                                    <strong>File:</strong> {record.importFileName}
                                  </div>
                                  {record.importBatchId && (
                                    <div>
                                      <strong>Batch ID:</strong> {record.importBatchId}
                                    </div>
                                  )}
                                  {record.updatedAt && (
                                    <>
                                      <div>
                                        <strong>Last Updated:</strong>{' '}
                                        {dtrService.formatDateTime(record.updatedAt)}
                                      </div>
                                      {record.updatedByUsername && (
                                        <div>
                                          <strong>Updated By:</strong>{' '}
                                          {record.updatedByUsername}
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {record.notes && (
                                    <div>
                                      <strong>Notes:</strong> {record.notes}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status || 'Unknown')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(record)}
                          disabled={record.status !== 'Active'}
                          title="Edit record"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(record)}
                          disabled={record.status === 'Deleted'}
                          title="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && filteredRecords.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredRecords.length)} of{' '}
              {filteredRecords.length} records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
                <span className="text-sm">Page</span>
                <span className="text-sm font-medium">{currentPage}</span>
                <span className="text-sm">of</span>
                <span className="text-sm font-medium">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit DTR Record</DialogTitle>
            <DialogDescription>
              Update working days and notes for {editingRecord?.employeeName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workingDays">Working Days</Label>
              <Input
                id="workingDays"
                type="number"
                step="0.01"
                min="0"
                value={editWorkingDays}
                onChange={(e) => setEditWorkingDays(e.target.value)}
                placeholder="Enter working days"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes to explain the change..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete DTR Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the DTR record for{' '}
              <strong>{deletingRecord?.employeeName}</strong>? This action will mark the
              record as deleted and it will no longer be used in payroll calculations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
