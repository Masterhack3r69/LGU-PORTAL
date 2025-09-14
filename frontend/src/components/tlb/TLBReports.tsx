// components/tlb/TLBReports.tsx - TLB Reports and Statistics Component
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { tlbService } from '@/services/tlbService';
import { toast } from 'sonner';
import type { TLBStatistics, TLBSummaryReport, TLBStatus } from '@/types/tlb';
import { BarChart3, Download, FileText, DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';

export function TLBReports() {
  const [statistics, setStatistics] = useState<TLBStatistics | null>(null);
  const [summaryReport, setSummaryReport] = useState<TLBSummaryReport | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  // Generate year options for the last 5 years
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchStatistics();
    fetchSummaryReport();
  }, [selectedYear, selectedStatus]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const stats = await tlbService.getStatistics(selectedYear);
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching TLB statistics:', error);
      toast.error('Failed to fetch statistics');
    }
  };

  const fetchSummaryReport = async () => {
    try {
      const statusFilter = selectedStatus === 'all' ? undefined : selectedStatus;
      const report = await tlbService.getSummaryReport(selectedYear, statusFilter);
      setSummaryReport(report);
    } catch (error) {
      console.error('Error fetching TLB summary report:', error);
      toast.error('Failed to fetch summary report');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: TLBStatus) => {
    const colors = {
      'Computed': 'bg-blue-100 text-blue-800',
      'Approved': 'bg-green-100 text-green-800',
      'Paid': 'bg-emerald-100 text-emerald-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            TLB Reports & Analytics
          </CardTitle>
          <CardDescription>
            View comprehensive statistics and reports for Terminal Leave Benefits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
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

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  fetchStatistics();
                  fetchSummaryReport();
                }}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{statistics.summary.total_records}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Computed</p>
                  <p className="text-lg font-bold font-mono">
                    {tlbService.formatCurrency(statistics.summary.total_computed_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-bold font-mono">
                    {tlbService.formatCurrency(statistics.summary.total_paid_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Amount</p>
                  <p className="text-lg font-bold font-mono">
                    {tlbService.formatCurrency(statistics.summary.average_amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Breakdown */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.status_breakdown.computed}
                </div>
                <div className="text-sm text-blue-600">Computed</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.status_breakdown.approved}
                </div>
                <div className="text-sm text-green-600">Approved</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {statistics.status_breakdown.paid}
                </div>
                <div className="text-sm text-emerald-600">Paid</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {statistics.status_breakdown.cancelled}
                </div>
                <div className="text-sm text-red-600">Cancelled</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Report */}
      {summaryReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Detailed Summary Report
            </CardTitle>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Filtered by: Year {selectedYear}
                {selectedStatus !== 'all' && `, Status: ${selectedStatus}`}
              </div>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary Totals */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold">{summaryReport.totals.total_records}</div>
                  <div className="text-sm text-muted-foreground">Total Records</div>
                </div>
                <div>
                  <div className="text-lg font-bold font-mono">
                    {summaryReport.totals.formatted_total_amount}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                </div>
                <div>
                  <div className="text-lg font-bold font-mono">
                    {summaryReport.totals.total_records > 0
                      ? tlbService.formatCurrency(summaryReport.totals.total_amount / summaryReport.totals.total_records)
                      : '₱0.00'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Average Amount</div>
                </div>
              </div>
            </div>

            {/* Status Summary */}
            {summaryReport.summary.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Summary by Status</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Records</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Average</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryReport.summary.map((item) => (
                      <TableRow key={item.status}>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{item.record_count}</TableCell>
                        <TableCell className="text-right font-mono">
                          {tlbService.formatCurrency(item.total_amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {tlbService.formatCurrency(item.average_amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {tlbService.formatCurrency(item.min_amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {tlbService.formatCurrency(item.max_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Detailed Records */}
            {summaryReport.details.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recent Records</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Employee #</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Claim Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryReport.details.slice(0, 10).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.employee_name}</TableCell>
                        <TableCell className="font-mono">{record.employee_number}</TableCell>
                        <TableCell className="text-right font-mono">
                          {tlbService.formatCurrency(record.computed_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{tlbService.formatDate(record.claim_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {summaryReport.details.length > 10 && (
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    Showing 10 of {summaryReport.details.length} records
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!loading && summaryReport && summaryReport.totals.total_records === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No TLB Records Found</h3>
            <p className="text-muted-foreground">
              No Terminal Leave Benefits records found for the selected filters.
              {selectedYear !== currentYear && ` Try selecting year ${currentYear} or adjust your filters.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}