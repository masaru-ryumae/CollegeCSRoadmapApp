import type { PersonalizedRoadmap, RoadmapProgress, DecisionAnswers } from '../types';

export interface ExportedUserData {
  version: string;
  exportedAt: string;
  userId: string;
  email?: string;
  displayName?: string;
  data: {
    answers: Partial<DecisionAnswers>;
    roadmap: PersonalizedRoadmap | null;
    progress: RoadmapProgress | null;
    favorites: string[];
  };
}

export async function exportUserData(userId: string): Promise<void> {
  try {
    // Fetch data from localStorage (in production, this would come from cloud)
    const saved = localStorage.getItem('cs-roadmap-app');
    const appData = saved ? JSON.parse(saved) : {};

    const cloudCache = localStorage.getItem('cs-roadmap-cloud-cache');
    const cloudData = cloudCache ? JSON.parse(cloudCache) : {};

    const exportData: ExportedUserData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userId,
      email: cloudData.userId ? undefined : 'not-synced',
      displayName: appData.displayName,
      data: {
        answers: appData.answers || {},
        roadmap: appData.roadmap || cloudData.roadmap || null,
        progress: cloudData.progress || null,
        favorites: cloudData.favorites || []
      }
    };

    // Create JSON blob
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cs-roadmap-export-${userId}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to export user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function importUserData(file: File): Promise<Partial<ExportedUserData>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedData: ExportedUserData = JSON.parse(content);

        // Validate structure
        if (!importedData.version || !importedData.data) {
          throw new Error('Invalid export file format');
        }

        // Store in localStorage
        const appData = {
          answers: importedData.data.answers,
          roadmap: importedData.data.roadmap,
          displayName: importedData.displayName,
          darkMode: false,
          activeView: 'dashboard'
        };

        localStorage.setItem('cs-roadmap-app', JSON.stringify(appData));

        // Store cloud cache
        const cloudCache = {
          userId: importedData.userId,
          email: importedData.email,
          favorites: importedData.data.favorites,
          progress: importedData.data.progress,
          roadmap: importedData.data.roadmap,
          lastSyncedAt: importedData.exportedAt
        };

        localStorage.setItem('cs-roadmap-cloud-cache', JSON.stringify(cloudCache));

        resolve(importedData);
      } catch (error) {
        reject(new Error(`Failed to parse import file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

export async function exportAsCSV(projectId: string, data: any): Promise<void> {
  try {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${projectId}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to export as CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function convertToCSV(data: any): string {
  if (!Array.isArray(data)) {
    data = [data];
  }

  if (data.length === 0) {
    return '';
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.map(escapeCSVValue).join(',');

  // Get rows
  const csvRows = data.map(row =>
    headers.map(header => escapeCSVValue(row[header])).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export async function backupAllData(userId: string): Promise<string> {
  try {
    const backup = {
      timestamp: Date.now(),
      data: localStorage.getItem('cs-roadmap-app'),
      cloudCache: localStorage.getItem('cs-roadmap-cloud-cache'),
      offlineQueue: localStorage.getItem('cs-roadmap-offline-queue')
    };

    const backupKey = `backup-${userId}-${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));

    return backupKey;
  } catch (error) {
    throw new Error(`Failed to backup data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function restoreFromBackup(backupKey: string): boolean {
  try {
    const backup = localStorage.getItem(backupKey);
    if (!backup) {
      throw new Error('Backup not found');
    }

    const { data, cloudCache, offlineQueue } = JSON.parse(backup);

    if (data) localStorage.setItem('cs-roadmap-app', data);
    if (cloudCache) localStorage.setItem('cs-roadmap-cloud-cache', cloudCache);
    if (offlineQueue) localStorage.setItem('cs-roadmap-offline-queue', offlineQueue);

    return true;
  } catch (error) {
    console.error('Failed to restore from backup', error);
    return false;
  }
}

export function listBackups(): { key: string; timestamp: number }[] {
  const backups: { key: string; timestamp: number }[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('backup-')) {
      const backup = localStorage.getItem(key);
      if (backup) {
        try {
          const { timestamp } = JSON.parse(backup);
          backups.push({ key, timestamp });
        } catch (e) {
          console.warn('Failed to parse backup', key);
        }
      }
    }
  }

  return backups.sort((a, b) => b.timestamp - a.timestamp);
}
