import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  Upload, 
  AlertTriangle,
  HardDrive,
  Calendar,
  FileText,
  Shield
} from 'lucide-react';
import { showToast} from "@/lib/toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

import { backupService } from '@/services/backupService';
import type { BackupFile, BackupStatus } from '@/types/backup';

const AdminBackupManagement: React.FC = () => {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Dialog states
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);

  // Load backups and status
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [backupsResponse, statusResponse] = await Promise.all([
        backupService.listBackups(),
        backupService.getBackupStatus()
      ]);

      if (backupsResponse.success && Array.isArray(backupsResponse.data)) {
        setBackups(backupsResponse.data);
      }

      if (statusResponse.success) {
        setBackupStatus(statusResponse.data);
      }
    } catch (error) {
      console.error('Failed to load backup data:', error);
      showToast.error('Failed to load backup data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create backup
  const handleCreateBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const response = await backupService.createBackup();
      
      if (response.success) {
        showToast.success('Backup created successfully');
        await loadData(); // Reload data
      } else {
        showToast.error(response.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
      showToast.error('Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Download backup
  const handleDownloadBackup = async (backup: BackupFile) => {
    try {
      await backupService.downloadBackup(backup.filename);
      showToast.success('Backup download started');
    } catch (error) {
      console.error('Failed to download backup:', error);
      showToast.error('Failed to download backup');
    }
  };

  // Restore backup
  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      setIsRestoring(true);
      const response = await backupService.restoreBackup(selectedBackup.filename);
      
      if (response.success) {
        showToast.success('Database restored successfully');
        setIsRestoreDialogOpen(false);
        setSelectedBackup(null);
      } else {
        showToast.error(response.error || 'Failed to restore backup');
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      showToast.error('Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  // Delete backup
  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;

    try {
      const response = await backupService.deleteBackup(selectedBackup.filename);
      
      if (response.success) {
        showToast.success('Backup deleted successfully');
        setIsDeleteDialogOpen(false);
        setSelectedBackup(null);
        await loadData(); // Reload data
      } else {
        showToast.error(response.error || 'Failed to delete backup');
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
      showToast.error('Failed to delete backup');
    }
  };

  // Open restore dialog
  const openRestoreDialog = (backup: BackupFile) => {
    setSelectedBackup(backup);
    setIsRestoreDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (backup: BackupFile) => {
    setSelectedBackup(backup);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="container space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background pb-4 pt-2 border-b border-border w-full">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Database Backup & Restore</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage database backups and restore operations
          </p>
        </div>
      </div>
      

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupStatus?.backupCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available backup files
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupStatus?.totalSizeFormatted || '0 Bytes'}
            </div>
            <p className="text-xs text-muted-foreground">
              Storage used by backups
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupStatus?.lastBackup ? (
                <span className="text-green-600">Recent</span>
              ) : (
                <span className="text-gray-600">None</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {backupStatus?.lastBackup || 'No backups available'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Healthy
            </div>
            <p className="text-xs text-muted-foreground">
              Backup system operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Backup Operations
          </CardTitle>
          <CardDescription>
            Create new backups or manage existing ones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={handleCreateBackup} 
              disabled={isCreatingBackup || isLoading}
              className="flex items-center gap-2"
            >
              {isCreatingBackup ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={loadData} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Backups</CardTitle>
          <CardDescription>
            {backups.length} backup files available
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Loading backups...</p>
              </div>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backup files found.</p>
              <p className="text-sm">Create your first backup to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Modified</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.filename}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <code className="text-sm">{backup.filename}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {backup.sizeFormatted}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(parseISO(backup.created_at), 'MMM dd, yyyy')}
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(backup.created_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(parseISO(backup.modified_at), 'MMM dd, yyyy')}
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(backup.modified_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRestoreDialog(backup)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(backup)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Restore Database
            </DialogTitle>
            <DialogDescription>
              This will restore the database from the selected backup. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Warning</h4>
                <p className="text-sm text-orange-700">
                  Restoring will overwrite all current data in the database. Make sure you have a recent backup before proceeding.
                </p>
              </div>
              
              <div className="space-y-2">
                <p><strong>Backup File:</strong> {selectedBackup.filename}</p>
                <p><strong>Size:</strong> {selectedBackup.sizeFormatted}</p>
                <p><strong>Created:</strong> {format(parseISO(selectedBackup.created_at), 'PPpp')}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRestoreDialogOpen(false)}
              disabled={isRestoring}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRestoreBackup}
              disabled={isRestoring}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Database
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup file? This action cannot be undone.
              {selectedBackup && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <strong>File:</strong> {selectedBackup.filename}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBackup}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBackupManagement;