export interface BackupFile {
  filename: string;
  size: number;
  sizeFormatted: string;
  created_at: string;
  modified_at: string;
}

export interface BackupStatus {
  backupCount: number;
  totalSize: number;
  totalSizeFormatted: string;
  backupPath: string;
  lastBackup: string | null;
}

export interface BackupResponse {
  success: boolean;
  data?: BackupFile[] | BackupFile | BackupStatus;
  message?: string;
  error?: string;
}

export interface CreateBackupResponse {
  success: boolean;
  data?: {
    filename: string;
    size: number;
    sizeFormatted: string;
    created_at: string;
  };
  message?: string;
  error?: string;
}