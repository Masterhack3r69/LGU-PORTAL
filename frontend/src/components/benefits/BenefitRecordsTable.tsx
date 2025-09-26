import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import type {
  CompensationBenefit,
  CompensationFilters,
  BenefitType,
} from "@/types/compensation";
import { BENEFIT_TYPE_LABELS } from "@/types/compensation";
import { compensationService } from "@/services/compensationService";
import { showToast } from "@/lib/toast"
import { BenefitRecordDialog } from "./BenefitRecordDialog";

interface BenefitRecordsTableProps {
  onRefresh: () => void;
}

export function BenefitRecordsTable({ onRefresh }: BenefitRecordsTableProps) {
  const [records, setRecords] = useState<CompensationBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CompensationFilters>({
    page: 1,
    limit: 10,
  });
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [filters, searchTerm]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const filtersWithSearch = {
        ...filters,
        ...(searchTerm && { search: searchTerm }),
      };
      const response = await compensationService.getRecords(filtersWithSearch);
      setRecords(response.records);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to load records:", error);
      showToast.error("Failed to load benefit records");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    key: keyof CompensationFilters,
    value: string | number | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : (value as number), // Reset to page 1 when changing other filters
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, page: 1 })); // Reset to page 1 when searching
  };

  const handleViewRecord = (recordId: number) => {
    setSelectedRecordId(recordId);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this benefit record?")) {
      return;
    }

    try {
      await compensationService.deleteRecord(id);
      showToast.success("Benefit record deleted successfully");
      loadRecords();
      onRefresh();
    } catch (error) {
      console.error("Failed to delete record:", error);
      showToast.error("Failed to delete benefit record");
    }
  };

  const getBenefitTypeBadgeVariant = (type: BenefitType) => {
    switch (type) {
      case "TERMINAL_LEAVE":
        return "destructive";
      case "PBB":
        return "default";
      case "MID_YEAR_BONUS":
      case "YEAR_END_BONUS":
        return "secondary";
      case "MONETIZATION":
        return "outline";
      case "LOYALTY":
        return "default";
      default:
        return "secondary";
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
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          <Select
            value={filters.benefit_type || "all"}
            onValueChange={(value) =>
              handleFilterChange(
                "benefit_type",
                value === "all" ? undefined : (value as BenefitType)
              )
            }
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
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-md border px-3">
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
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No benefit records found
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.employee_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.employee_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getBenefitTypeBadgeVariant(
                          record.benefit_type
                        )}
                      >
                        {BENEFIT_TYPE_LABELS[record.benefit_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.days_used ? `${record.days_used} days` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {compensationService.formatCurrency(record.amount)}
                    </TableCell>
                    <TableCell>
                      {compensationService.formatDate(record.processed_at)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {record.processed_by_name || "System"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewRecord(record.id)}
                        >
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : records.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No benefit records found
              </CardContent>
            </Card>
          ) : (
            records.map((record) => (
              <Card
                key={record.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">
                          {record.employee_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.employee_number}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewRecord(record.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Benefit Type and Amount */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={getBenefitTypeBadgeVariant(
                          record.benefit_type
                        )}
                      >
                        {BENEFIT_TYPE_LABELS[record.benefit_type]}
                      </Badge>
                      <div className="text-lg font-semibold">
                        {compensationService.formatCurrency(record.amount)}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Days Used:
                        </span>
                        <div className="font-medium">
                          {record.days_used ? `${record.days_used} days` : "-"}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Processed:
                        </span>
                        <div className="font-medium">
                          {compensationService.formatDate(record.processed_at)}
                        </div>
                      </div>
                    </div>

                    {/* Processed By */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Processed by:
                      </span>
                      <span className="ml-1 font-medium">
                        {record.processed_by_name || "System"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {records.length} of {total} records
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleFilterChange("page", Math.max(1, filters.page! - 1))
              }
              disabled={filters.page === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
              <span className="text-sm">Page</span>
              <span className="text-sm font-medium">{filters.page}</span>
              <span className="text-sm">of</span>
              <span className="text-sm font-medium">{totalPages}</span>
            </div>
            <Button
              size="sm"
              onClick={() =>
                handleFilterChange(
                  "page",
                  Math.min(totalPages, filters.page! + 1)
                )
              }
              disabled={filters.page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Detail Dialog */}
      <BenefitRecordDialog
        recordId={selectedRecordId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
}
