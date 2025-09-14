// components/tlb/TLBRecordsList.tsx - TLB Records List with filtering and pagination
import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TLBRecordForm } from './TLBRecordForm';
import { TLBRecordDetails } from './TLBRecordDetails';
import { tlbService } from '@/services/tlbService';
import { toast } from 'sonner';
import type { TLBRecord, TLBFilters, TLBStatus } from '@/types/tlb';

export function TLBRecordsList() {
  const [records, setRecords] = useState<TLBRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<TLBRecord | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });

  const [filters, setFilters] = useState<TLBFilters>({
    page: 1,
    limit: 10,
    sort_by: 'claim_date',
    sort_order: 'DESC',
  });

  const fetchRecords = useCallback(async (currentFilters: TLBFilters) => {
    try {
      setLoading(true);
      const response = await tlbService.getTLBRecords(currentFilters);
      setRecords(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching TLB records:', error);
      toast.error('Failed to fetch TLB records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(filters);
  }, [filters, fetchRecords]);

  const handleFilterChange = (key: keyof TLBFilters, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (value as number), // Reset to page 1 when changing filters
    }));
  };

  const handleDelete = async (record: TLBRecord) => {
    if (record.status === 'Paid') {
      toast.error('Cannot delete paid TLB records');
      return;
    }

    if (window.confirm(`Are you sure you want to delete TLB record for ${record.employee_name}?`)) {
      try {
        await tlbService.deleteTLBRecord(record.id);
        toast.success('TLB record deleted successfully');
        fetchRecords(filters);
      } catch (error) {
        console.error('Error deleting TLB record:', error);
        toast.error('Failed to delete TLB record');
      }
    }
  };

  const handleRecordUpdated = () => {
    fetchRecords(filters);
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedRecord(null);
  };

  const getStatusBadgeVariant = (status: TLBStatus) => {
    const variants = {
      'Computed': 'default',
      'Approved': 'secondary',
      'Paid': 'default',
      'Cancelled': 'destructive',
    } as const;
    return variants[status] || 'default';
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>Loading TLB records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Computed">Computed</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create TLB Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New TLB Record</DialogTitle>
            </DialogHeader>
            <TLBRecordForm onSuccess={handleRecordUpdated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>TLB Records ({pagination.totalRecords})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Claim Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{record.employee_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {record.employee_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {tlbService.formatCurrency(record.computed_amount)}
                  </TableCell>
                  <TableCell>
                    {tlbService.formatDate(record.claim_date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {record.status !== 'Paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(record)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of{' '}
                {pagination.totalRecords} records
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.currentPage === 1}
                  onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>TLB Record Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <TLBRecordDetails 
              record={selectedRecord} 
              onClose={() => setShowDetailsDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit TLB Record</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <TLBRecordForm 
              record={selectedRecord}
              onSuccess={handleRecordUpdated}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}