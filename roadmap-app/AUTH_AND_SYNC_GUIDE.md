# Authentication & Cloud Sync Implementation Guide

This document describes the v2.1 authentication and cloud sync features.

## Overview

The authentication and cloud sync system provides:

1. **Multi-method Authentication**
   - Email/password signup and login
   - Google OAuth
   - GitHub OAuth
   - Anonymous/guest login

2. **Cloud Data Sync**
   - Real-time synchronization across devices
   - Offline-first architecture with queue
   - Conflict resolution (last-write-wins)
   - Automatic sync on reconnect

3. **User Profiles**
   - User info display
   - Profile customization
   - Settings management
   - Account deletion

4. **Data Portability**
   - GDPR-compliant data export
   - Data import
   - CSV export for projects
   - Automated backups

## Architecture

### Services

#### supabaseAuth.ts
Handles all authentication operations with Supabase.

**Main Functions:**
- `initSupabase()` - Initialize Supabase client
- `signUpWithEmail(data)` - Create account with email/password
- `loginWithEmail(data)` - Sign in with email/password
- `loginWithGoogle()` - OAuth login with Google
- `loginWithGitHub()` - OAuth login with GitHub
- `loginAnonymously()` - Create guest session
- `logout()` - Sign out user
- `getCurrentUser()` - Get current user info
- `getCurrentSession()` - Get active session
- `onAuthStateChanged(callback)` - Listen for auth changes
- `changePassword(newPassword)` - Update password
- `updateUserMetadata(metadata)` - Update user info

**Error Handling:**
All functions throw descriptive errors on failure. Client code should catch and display user-friendly messages.

#### cloudSync.ts
Manages cloud data synchronization and offline queuing.

**Main Functions:**
- `syncFavoritesToCloud(userId, favorites)` - Sync favorite modules
- `syncProgressToCloud(userId, progress)` - Sync learning progress
- `syncAnswersToCloud(userId, answers)` - Sync assessment answers
- `syncRoadmapToCloud(userId, roadmap)` - Sync generated roadmap
- `fetchFromCloud(userId)` - Load all user data from cloud
- `setupRealtimeSubscriptions(userId, callback)` - Enable live updates
- `processOfflineQueue(userId)` - Sync queued changes
- `setupSyncListeners(userId)` - Listen for online/offline events
- `getOfflineQueue()` - Get queued changes

**Offline Queue:**
When network is unavailable, changes are automatically queued to localStorage with these fields:
```typescript
{
  id: string; // Unique ID
  action: 'sync-favorites' | 'sync-progress' | 'sync-answers' | 'sync-roadmap';
  data: any; // The data to sync
  timestamp: number; // When queued
}
```

The queue is processed automatically when the device comes back online.

#### dataPortability.ts
Handles data export, import, and backup operations.

**Main Functions:**
- `exportUserData(userId)` - Download user data as JSON
- `importUserData(file)` - Load data from JSON file
- `exportAsCSV(projectId, data)` - Export data as CSV
- `backupAllData(userId)` - Create local backup
- `restoreFromBackup(backupKey)` - Restore from backup
- `listBackups()` - List available backups

### Components

#### AuthModal.jsx
Modal dialog for authentication with:
- Email/password login form
- Email/password signup form
- Google/GitHub OAuth buttons
- Anonymous login option
- Smooth transitions and animations
- Dark mode support

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}
```

#### UserProfile.jsx
Display component showing:
- User avatar
- Display name and email
- Stats (projects started, favorites, progress)
- Links to settings
- Logout button

**Props:**
```typescript
{
  user: AuthUser;
  stats?: {
    projectsStarted: number;
    favorites: number;
    progress: number;
  };
  onLogout?: () => void;
}
```

#### ProfileSettings.jsx
Full-page settings screen with:
- Profile information editor
- Password change form
- Data export button
- Account deletion confirmation

## Usage Examples

### Setup

```typescript
import { initSupabase } from './services/supabaseAuth';

// In your app initialization
initSupabase();
```

### Authentication

```typescript
import { signUpWithEmail, loginWithEmail } from './services/supabaseAuth';

// Sign up
const { user, session } = await signUpWithEmail({
  email: 'user@example.com',
  password: 'secure-password',
  displayName: 'John Doe'
});

// Login
const { user, session } = await loginWithEmail({
  email: 'user@example.com',
  password: 'secure-password'
});

// Anonymous
const { user } = await loginAnonymously();
```

### Cloud Sync

```typescript
import { syncFavoritesToCloud, setupRealtimeSubscriptions } from './services/cloudSync';

// Sync data
await syncFavoritesToCloud(userId, ['module-1', 'module-2']);

// Setup real-time updates
const unsubscribe = setupRealtimeSubscriptions(userId, (data) => {
  console.log('Data updated:', data);
  // Update UI
});

// Cleanup
unsubscribe();
```

### Data Export

```typescript
import { exportUserData, exportAsCSV } from './utils/dataPortability';

// Export all data as JSON
await exportUserData(userId);

// Export specific data as CSV
await exportAsCSV('project-1', projectData);
```

## Integration with AppContext

The AppContext has been enhanced with auth state:

```typescript
const { state, dispatch } = useApp();

// User info
state.user; // Current AuthUser or null
state.isAuthenticated; // Boolean
state.isSyncing; // Boolean during cloud sync

// Favorites
state.favorites; // Array of favorite module IDs

// Dispatch actions
dispatch({ type: 'SET_USER', user });
dispatch({ type: 'SET_AUTHENTICATED', isAuthenticated: true });
dispatch({ type: 'ADD_FAVORITE', moduleId });
dispatch({ type: 'REMOVE_FAVORITE', moduleId });
dispatch({ type: 'SET_SYNCING', isSyncing: true });
```

## Database Schema

Required Supabase tables:

### user_data
```sql
CREATE TABLE user_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
  favorites JSONB DEFAULT '[]',
  progress JSONB,
  answers JSONB,
  roadmap JSONB,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Allow users to only access their own data
CREATE POLICY "user_read" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_update" ON user_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_insert" ON user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Environment Variables

Create `.env.local` with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

See `.env.example` for all options.

## Error Handling

All async functions throw descriptive errors. Recommended pattern:

```typescript
try {
  await someAuthFunction();
} catch (error) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  // Show to user
}
```

Common errors:
- "Invalid credentials" - Wrong email/password
- "User already exists" - Email registered
- "Network error" - Offline (uses offline queue)
- "RLS policy violation" - Permission denied

## Testing

Run tests with:
```bash
npm test
```

Test files:
- `src/services/__tests__/supabaseAuth.test.ts`
- `src/services/__tests__/cloudSync.test.ts`
- `src/utils/__tests__/dataPortability.test.ts`

## Security Considerations

1. **Passwords**: Never logged or stored client-side (Supabase handles)
2. **Tokens**: Supabase manages session tokens automatically
3. **RLS**: Database policies prevent cross-user data access
4. **HTTPS**: Always use HTTPS in production
5. **GDPR**: Data export/import enabled for compliance

## Troubleshooting

### OAuth not working
- Verify redirect URLs match exactly in Supabase
- Check OAuth app credentials are correct
- Ensure CORS is configured

### Offline queue not syncing
- Check browser is actually online
- Verify network connectivity
- Check browser console for errors

### Data not syncing
- Ensure user is authenticated
- Check Supabase connection
- Verify RLS policies allow access
- Check browser console logs

## Future Enhancements

- [ ] Two-factor authentication
- [ ] Social login with more providers
- [ ] End-to-end encryption
- [ ] Selective data sync
- [ ] Conflict resolution UI
- [ ] Data versioning/history
- [ ] Team/collaborative features

## Related Documentation

- SUPABASE_SETUP.md - Setup instructions
- services/supabaseAuth.ts - Auth implementation
- services/cloudSync.ts - Sync implementation
- utils/dataPortability.ts - Export/import
