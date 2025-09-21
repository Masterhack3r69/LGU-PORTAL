import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BarChart3, Download, FileText, Filter, Calendar } from 'lucide-react';
import benefitsService from '@/services/benefitsService';
import type { BenefitCycle, BenefitType, BenefitStatistics, BenefitReportFilter } from '@/types/benefits';

const BenefitsReports: React.FC = () => {
  const [benefitCycles, setBenefitCycles] = useState<BenefitCycle[]>([]);
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [statistics, setStatistics] = useState<BenefitStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportFilter, setReportFilter] = useState<BenefitReportFilter>({
    cycle_year: new Date().getFullYear()
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cyclesResponse, typesResponse, statsResponse] = await Promise.all([
        benefitsService.getBenefitCycles(),
        benefitsService.getBenefitTypes(),
        benefitsService.getBenefitStatistics()
      ]);

      if (cyclesResponse.success) {
        const data = cyclesResponse.data;
        const cyclesData = Array.isArray(data) ? data : (data as { benefit_cycles?: BenefitCycle[] })?.benefit_cycles || [];
        setBenefitCycles(cyclesData);
      }

      if (typesResponse.success) {
        const data = typesResponse.data;
        const typesData = Array.isArray(data) ? data : (data as { benefit_types?: BenefitType[] })?.benefit_types || [];
        setBenefitTypes(typesData.filter(type => type.is_active));
      }

      if (statsResponse.success) {
        const data = statsResponse.data;
        setStatistics(data);
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await benefitsService.generateBenefitReport(reportFilter, format);
      const blob = new Blob([response], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `benefits-report-${reportFilter.cycle_year || 'all'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Report exported successfully`);
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report');
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(numAmount);
  };

  const safeToFixed = (value: number | string | null | undefined, decimals: number = 2) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
    return isNaN(numValue) ? '0.00' : numValue.toFixed(decimals);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Benefits Reports</h2>
          <p className="text-sm text-muted-foreground">
            View reports and analytics for benefits processing
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{statistics.total_items || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-green-500" />
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(statistics.total_amount)}</div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(safeToFixed(statistics.average_benefit_amount, 0))}</div>
                  <div className="text-sm text-muted-foreground">Average Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{statistics.paid_count || 0}</div>
                  <div className="text-sm text-muted-foreground">Paid Items</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Filter and export benefit reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycle_year">Year</Label>
              <Select
                value={reportFilter.cycle_year?.toString() || 'all'}
                onValueChange={(value) => setReportFilter({
                  ...reportFilter,
                  cycle_year: value === 'all' ? undefined : parseInt(value)
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {Array.from(new Set(benefitCycles.map(c => c.cycle_year))).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefit_type">Benefit Type</Label>
              <Select
                value={reportFilter.benefit_type_id?.toString() || 'all'}
                onValueChange={(value) => setReportFilter({
                  ...reportFilter,
                  benefit_type_id: value === 'all' ? undefined : parseInt(value)
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {benefitTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={reportFilter.status || 'all'}
                onValueChange={(value) => setReportFilter({
                  ...reportFilter,
                  status: value === 'all' ? undefined : value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Calculated">Calculated</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleExportReport('pdf')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={() => handleExportReport('excel')} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>
              Distribution of benefit items by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { status: 'Draft', count: statistics.draft_count || 0, key: 'draft' },
                { status: 'Calculated', count: statistics.calculated_count || 0, key: 'calculated' },
                { status: 'Approved', count: statistics.approved_count || 0, key: 'approved' },
                { status: 'Paid', count: statistics.paid_count || 0, key: 'paid' },
                { status: 'Cancelled', count: statistics.cancelled_count || 0, key: 'cancelled' }
              ].map(({ status, count, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{status.toLowerCase()}</Badge>
                    <span className="text-sm text-muted-foreground">{count || 0} items</span>
                  </div>
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(statistics.total_items || 0) > 0 ? ((count || 0) / (statistics.total_items || 1)) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {statistics && Object.keys(statistics.by_category || {}).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>
              Benefits distribution by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Average Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(statistics.by_category).map(([category, data]) => (
                  <TableRow key={category}>
                    <TableCell>
                      <Badge variant="outline">{category}</Badge>
                    </TableCell>
                    <TableCell>{data.count || 0}</TableCell>
                    <TableCell>{formatCurrency(data.total_amount)}</TableCell>
                    <TableCell>{formatCurrency((data.total_amount || 0) / (data.count || 1))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BenefitsReports;