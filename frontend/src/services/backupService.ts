import { apiService } from './api';
import type { BackupResponse, CreateBackupResponse, BackupFile, BackupStatus } from '@/types/backup';

export const backupService = {
  // List available backups
  async listBackups(): Promise<BackupResponse> {
    const response = await apiService.get<BackupResponse>('/backup/list');
    return response;
  },

  // Create new backup
  async createBackup(): Promise<CreateBackupResponse> {
    const response = await apiService.post<CreateBackupResponse>('/backup/create');
    return response;
  },

  // Restore from backup
  async restoreBackup(filename: string): Promise<BackupResponse> {
    const response = await apiService.post<BackupResponse>(`/backup/restore/${filename}`);
    return response;
  },

  // Delete backup file
  async deleteBackup(filename: string): Promise<BackupResponse> {
    const response = await apiService.delete<BackupResponse>(`/backup/${filename}`);
    return response;
  },

  // Download backup file
  async downloadBackup(filename: string): Promise<void> {
    try {
      const response = await fetch(`/api/backup/download/${filename}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },

  // Get backup status
  async getBackupStatus(): Promise<{ success: boolean; data: BackupStatus }> {
    const response = await apiService.get<{ success: boolean; data: BackupStatus }>('/backup/status');
    return response;
  },
};