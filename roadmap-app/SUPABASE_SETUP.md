# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in/create account
2. Click "New Project"
3. Fill in project details and create
4. Wait for project to initialize

## Step 2: Set Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-api-settings
```

You can find these in Supabase dashboard under Settings > API.

## Step 3: Create Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Create user_data table
CREATE TABLE user_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  favorites JSONB DEFAULT '[]'::jsonb,
  progress JSONB,
  answers JSONB,
  roadmap JSONB,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own data
CREATE POLICY "Users can read their own data"
  ON user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can update their own data
CREATE POLICY "Users can update their own data"
  ON user_data
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can insert their own data
CREATE POLICY "Users can insert their own data"
  ON user_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX user_data_user_id_idx ON user_data(user_id);
```

## Step 4: Enable Authentication Providers

### Email/Password
1. Go to Authentication > Providers
2. Email is enabled by default
3. Configure settings as needed

### Google OAuth
1. Go to Authentication > Providers > Google
2. Enable it
3. Add your Google Client ID and Secret (get from Google Cloud Console)

### GitHub OAuth
1. Go to Authentication > Providers > GitHub
2. Enable it
3. Add your GitHub OAuth credentials

## Step 5: Configure OAuth Redirect URLs

1. Go to Authentication > URL Configuration
2. Add your app URL(s) to "Redirect URLs"
   - For local development: `http://localhost:5173/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`

## Step 6: Set CORS

1. Go to Authentication > URL Configuration
2. Add your app domain to CORS allowed list

## Step 7: Test the Setup

1. Run the development server: `npm run dev`
2. Try signing up with email
3. Try OAuth providers
4. Verify data syncs to cloud

## Troubleshooting

### "Invalid credentials" error
- Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Make sure .env.local is in .gitignore

### OAuth not working
- Check redirect URLs match exactly
- Verify OAuth app credentials are correct
- Check CORS settings

### RLS policy errors
- Verify Row Level Security is enabled
- Check that policies are created correctly
- Test with authenticated user

## Database Tables

### user_data
Stores all user-related data with real-time subscriptions enabled.

Columns:
- `id`: Primary key
- `user_id`: Foreign key to auth.users
- `favorites`: Array of favorite module IDs
- `progress`: RoadmapProgress object
- `answers`: DecisionAnswers object
- `roadmap`: PersonalizedRoadmap object
- `last_synced_at`: Last sync timestamp
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Real-time Features

The cloud sync service uses Supabase's real-time subscriptions to:
- Watch for changes to user data
- Automatically update UI across devices
- Queue changes for offline sync

This is automatically set up when you enable the table for real-time.

## Backups

Regular backups are recommended. Configure in Supabase Settings > Backups.

## Next Steps

See `src/services/supabaseAuth.ts` and `src/services/cloudSync.ts` for implementation details.
