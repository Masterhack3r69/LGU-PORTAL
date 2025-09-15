import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Search, Filter, Eye, Calendar, User, Database } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { auditService } from '@/services/auditService';
import type { AuditLog, AuditLogFilters } from '@/types/audit';
import { AUDIT_ACTIONS, AUDIT_TABLES } from '@/types/audit';

const AdminAuditLogsManagement: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    page: 1,
  });

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await auditService.getAuditLogs(filters);
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  // Filter handlers
  const handleFilterChange = (key: keyof AuditLogFilters, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Reset to first page when filtering
    }));
  };

  const clearFilters = () => {
    setFilters({
      limit: 50,
      page: 1,
    });
  };

  // Get action badge color
  const getActionColor = (action: string) => {
    const actionConfig = AUDIT_ACTIONS.find(a => action.includes(a.value));
    return actionConfig?.color || 'bg-gray-100 text-gray-800';
  };

  // Get action display name
  const getActionLabel = (action: string) => {
    const actionConfig = AUDIT_ACTIONS.find(a => action.includes(a.value));
    if (actionConfig) return actionConfig.label;
    
    // Fallback for complex action names
    if (action.includes('CREATE')) return 'Create';
    if (action.includes('UPDATE')) return 'Update';
    if (action.includes('DELETE')) return 'Delete';
    if (action.includes('APPROVE')) return 'Approve';
    if (action.includes('REJECT')) return 'Reject';
    if (action.includes('CANCEL')) return 'Cancel';
    
    return action;
  };

  // Format table name for display
  const getTableLabel = (tableName: string) => {
    const tableConfig = AUDIT_TABLES.find(t => t.value === tableName);
    return tableConfig?.label || tableName;
  };

  // Parse JSON values safely
  const parseJsonSafely = (jsonString: string | null) => {
    if (!jsonString) return null;
    
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  };

  // View details handler
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all system activities and changes made by users
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter audit logs by user, action, table, or date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User ID Filter */}
            <div className="space-y-2">
              <Label htmlFor="user-filter">User ID</Label>
              <Input
                id="user-filter"
                placeholder="Enter user ID"
                type="number"
                value={filters.user_id || ''}
                onChange={(e) => handleFilterChange('user_id', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            {/* Table Filter */}
            <div className="space-y-2">
              <Label htmlFor="table-filter">Table</Label>
              <Select
                value={filters.table_name || 'all'}
                onValueChange={(value) => handleFilterChange('table_name', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {AUDIT_TABLES.map((table) => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <Label htmlFor="action-filter">Action</Label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value) => handleFilterChange('action', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {AUDIT_ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="date-filter">Start Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={loadAuditLogs} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            {auditLogs.length} log entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p>Loading audit logs...</p>
              </div>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found with the current filters.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Record ID</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {format(parseISO(log.created_at), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(parseISO(log.created_at), 'HH:mm:ss')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {log.user_full_name || log.username || `User ${log.user_id}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {log.user_id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)} variant="secondary">
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTableLabel(log.table_name)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.record_id ? (
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                            {log.record_id}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{log.ip_address}</code>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about the audit log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="mt-1 text-sm">
                    {format(parseISO(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="mt-1 text-sm">
                    {selectedLog.user_full_name || selectedLog.username || `User ${selectedLog.user_id}`}
                    <span className="text-muted-foreground ml-1">(ID: {selectedLog.user_id})</span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <p className="mt-1">
                    <Badge className={getActionColor(selectedLog.action)} variant="secondary">
                      {selectedLog.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Table</Label>
                  <p className="mt-1">
                    <Badge variant="outline">
                      {getTableLabel(selectedLog.table_name)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Record ID</Label>
                  <p className="mt-1 text-sm">
                    {selectedLog.record_id ? (
                      <code className="px-2 py-1 bg-gray-100 rounded">
                        {selectedLog.record_id}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="mt-1 text-sm">
                    <code>{selectedLog.ip_address}</code>
                  </p>
                </div>
              </div>

              {/* User Agent */}
              <div>
                <Label className="text-sm font-medium">User Agent</Label>
                <p className="mt-1 text-sm text-muted-foreground break-all">
                  {selectedLog.user_agent}
                </p>
              </div>

              {/* Data Changes */}
              {(selectedLog.old_values || selectedLog.new_values) && (
                <Tabs defaultValue="changes" className="w-full">
                  <TabsList>
                    <TabsTrigger value="changes">Data Changes</TabsTrigger>
                    {selectedLog.old_values && (
                      <TabsTrigger value="old">Old Values</TabsTrigger>
                    )}
                    {selectedLog.new_values && (
                      <TabsTrigger value="new">New Values</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="changes" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {selectedLog.old_values && (
                        <div>
                          <Label className="text-sm font-medium text-red-600">Before (Old Values)</Label>
                          <pre className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(parseJsonSafely(selectedLog.old_values), null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.new_values && (
                        <div>
                          <Label className="text-sm font-medium text-green-600">After (New Values)</Label>
                          <pre className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(parseJsonSafely(selectedLog.new_values), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {selectedLog.old_values && (
                    <TabsContent value="old">
                      <div>
                        <Label className="text-sm font-medium">Old Values (Raw JSON)</Label>
                        <pre className="mt-2 p-3 bg-gray-50 border rounded text-xs overflow-auto max-h-60">
                          {JSON.stringify(parseJsonSafely(selectedLog.old_values), null, 2)}
                        </pre>
                      </div>
                    </TabsContent>
                  )}

                  {selectedLog.new_values && (
                    <TabsContent value="new">
                      <div>
                        <Label className="text-sm font-medium">New Values (Raw JSON)</Label>
                        <pre className="mt-2 p-3 bg-gray-50 border rounded text-xs overflow-auto max-h-60">
                          {JSON.stringify(parseJsonSafely(selectedLog.new_values), null, 2)}
                        </pre>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuditLogsManagement;