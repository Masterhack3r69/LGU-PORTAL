import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import type { 
  CompensationBenefit, 
  CompensationFilters, 
  BenefitType
} from '@/types/compensation';
import { BENEFIT_TYPE_LABELS } from '@/types/compensation';
import { compensationService } from '@/services/compensationService';
import { toast } from 'sonner';

interface BenefitRecordsTableProps {
  onRefresh: () => void;
}

export function BenefitRecordsTable({ onRefresh }: BenefitRecordsTableProps) {
  const [records, setRecords] = useState<CompensationBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CompensationFilters>({
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadRecords();
  }, [filters]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await compensationService.getRecords(filters);
      setRecords(response.records);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load records:', error);
      toast.error('Failed to load benefit records');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CompensationFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (value as number) // Reset to page 1 when changing other filters
    }));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this benefit record?')) {
      return;
    }

    try {
      await compensationService.deleteRecord(id);
      toast.success('Benefit record deleted successfully');
      loadRecords();
      onRefresh();
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast.error('Failed to delete benefit record');
    }
  };

  const getBenefitTypeBadgeVariant = (type: BenefitType) => {
    switch (type) {
      case 'TERMINAL_LEAVE':
        return 'destructive';
      case 'PBB':
        return 'default';
      case 'MID_YEAR_BONUS':
      case 'YEAR_END_BONUS':
        return 'secondary';
      case 'MONETIZATION':
        return 'outline';
      case 'LOYALTY':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benefit Records</CardTitle>
        <CardDescription>
          View and manage all compensation benefit records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or number..."
                className="pl-10"
                onChange={() => {
                  // Note: This would need to be implemented in the backend
                  // For now, we'll just show the input
                }}
              />
            </div>
          </div>
          <Select
            value={filters.benefit_type || 'all'}
            onValueChange={(value) => handleFilterChange('benefit_type', value === 'all' ? undefined : value as BenefitType)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by benefit type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(BENEFIT_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Benefit Type</TableHead>
                <TableHead>Days Used</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Processed Date</TableHead>
                <TableHead>Processed By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No benefit records found
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.employee_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {record.employee_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBenefitTypeBadgeVariant(record.benefit_type)}>
                        {BENEFIT_TYPE_LABELS[record.benefit_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.days_used ? `${record.days_used} days` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {compensationService.formatCurrency(record.amount)}
                    </TableCell>
                    <TableCell>
                      {compensationService.formatDate(record.processed_at)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{record.processed_by_name}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(record.id)}
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {records.length} of {total} records
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('page', Math.max(1, filters.page! - 1))}
              disabled={filters.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm">Page</span>
              <span className="text-sm font-medium">{filters.page}</span>
              <span className="text-sm">of</span>
              <span className="text-sm font-medium">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page! + 1))}
              disabled={filters.page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}