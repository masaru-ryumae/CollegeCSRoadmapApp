import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportUserData,
  importUserData,
  exportAsCSV,
  backupAllData,
  restoreFromBackup,
  listBackups,
  type ExportedUserData
} from '../dataPortability';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Data Portability', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Export', () => {
    it('should export user data as JSON', async () => {
      const testData = {
        answers: { techLevel: 'beginner' },
        roadmap: null,
        progress: null,
        favorites: []
      };

      localStorage.setItem('cs-roadmap-app', JSON.stringify(testData));

      await exportUserData('user-123');
      // Function should complete without error
    });

    it('should export data as CSV', async () => {
      const testData = [
        { moduleId: 'module-1', status: 'done' },
        { moduleId: 'module-2', status: 'in-progress' }
      ];

      await exportAsCSV('project-1', testData);
      // Function should complete without error
    });
  });

  describe('Backup & Restore', () => {
    it('should create and list backups', () => {
      localStorage.setItem('cs-roadmap-app', JSON.stringify({ test: 'data' }));

      const backupKey = backupAllData('user-123');
      expect(typeof backupKey).toBe('string');
      expect(backupKey).toMatch(/^backup-user-123-/);

      const backups = listBackups();
      expect(Array.isArray(backups)).toBe(true);
    });

    it('should restore from backup', () => {
      localStorage.setItem('cs-roadmap-app', JSON.stringify({ original: 'data' }));

      const backupKey = backupAllData('user-123');

      localStorage.clear();
      localStorage.setItem('cs-roadmap-app', JSON.stringify({ modified: 'data' }));

      const restored = restoreFromBackup(backupKey);
      expect(restored).toBe(true);
    });

    it('should return false on invalid backup key', () => {
      const restored = restoreFromBackup('invalid-key');
      expect(restored).toBe(false);
    });
  });

  describe('Import', () => {
    it('should validate import file format', async () => {
      const exportData: ExportedUserData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        userId: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        data: {
          answers: {},
          roadmap: null,
          progress: null,
          favorites: []
        }
      };

      const jsonString = JSON.stringify(exportData);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], 'export.json', { type: 'application/json' });

      const imported = await importUserData(file);
      expect(imported.userId).toBe('user-123');
      expect(imported.email).toBe('test@example.com');
    });

    it('should reject invalid import file', async () => {
      const blob = new Blob(['invalid json'], { type: 'application/json' });
      const file = new File([blob], 'export.json', { type: 'application/json' });

      await expect(importUserData(file)).rejects.toThrow();
    });
  });
});

// Add vi to context
import { vi } from 'vitest';
