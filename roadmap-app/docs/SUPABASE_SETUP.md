# Supabase Setup Guide

This guide provides step-by-step instructions for setting up Supabase authentication and database for the College CS Roadmap application.

## Prerequisites

- Supabase account (free at https://supabase.com)
- Node.js 16+ and npm
- Git

## Step 1: Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in the following details:
   - **Name**: College CS Roadmap (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Select region closest to your users
4. Click **Create new project**
5. Wait for the project to initialize (2-5 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project, go to **Settings > API**
2. Copy the following:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Save these values securely

## Step 3: Configure Environment Variables

1. In the project root, copy the template file:
   ```bash
   cp docs/.env.local.template .env.local
   ```

2. Edit `.env.local` and paste your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Set your auth redirect URL (adjust for your environment):
   ```
   VITE_AUTH_REDIRECT_URL=http://localhost:5173
   ```

## Step 4: Enable Google OAuth

1. In your Supabase project, go to **Authentication > Providers**
2. Click on **Google**
3. Enable the provider and add OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create or select a project
   - Enable the Google+ API
   - Create OAuth 2.0 credentials (Web Application)
   - Add authorized redirect URIs:
     - Development: `https://your-project.supabase.co/auth/v1/callback`
     - Any other origins you'll use
   - Copy the Client ID and Client Secret back to Supabase

## Step 5: Create Database Tables

Run these SQL scripts in your Supabase SQL Editor (go to **SQL Editor > New Query**):

### Create Users Table
```sql
CREATE TABLE public.users (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  invite_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  PRIMARY KEY (id)
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public can view user names" ON public.users
  FOR SELECT USING (true);
```

### Create Progress Table
```sql
CREATE TABLE public.progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  time_spent INTEGER DEFAULT 0,
  weekly_schedule JSONB,
  deadline TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

CREATE INDEX idx_progress_user_id ON public.progress(user_id);
CREATE INDEX idx_progress_module_id ON public.progress(module_id);
CREATE INDEX idx_progress_user_module ON public.progress(user_id, module_id);

-- RLS Policies
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Create Resources Table
```sql
CREATE TABLE public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resources_module_id ON public.resources(module_id);
CREATE INDEX idx_resources_approved ON public.resources(approved);
CREATE INDEX idx_resources_created_by ON public.resources(created_by);

-- RLS Policies
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved resources" ON public.resources
  FOR SELECT USING (approved = true);

CREATE POLICY "Users can view their own submissions" ON public.resources
  FOR SELECT USING (auth.uid() = created_by OR approved = true);

CREATE POLICY "Users can create resources" ON public.resources
  FOR INSERT WITH CHECK (auth.uid() = created_by);
```

### Create Notifications Table
```sql
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  related_module_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update read status" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

### Create Invite Codes Table
```sql
CREATE TABLE public.invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.users(id),
  uses_remaining INTEGER,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  required BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_expires_at ON public.invite_codes(expires_at);

-- RLS Policies
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invite codes" ON public.invite_codes
  FOR SELECT USING (true);
```

### Create Trigger for New User Setup
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    NOW(),
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 6: Install Dependencies

```bash
cd roadmap-app
npm install
```

## Step 7: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Step 8: Test Authentication

1. Navigate to the app
2. Click **Sign in with Google**
3. Complete the Google OAuth flow
4. Verify that you're redirected back and logged in
5. Check Supabase Dashboard > Auth to see your new user

## Troubleshooting

### "Supabase configuration missing" warning
- Ensure `.env.local` is in the project root
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart the development server after adding environment variables

### OAuth redirect errors
- Verify the redirect URL in `.env.local` matches your setup
- Check Supabase > Authentication > URL Configuration
- Ensure Google OAuth credentials are correctly configured

### Table already exists errors
- You may need to drop tables before recreating them:
  ```sql
  DROP TABLE IF EXISTS public.table_name CASCADE;
  ```

### RLS policy denied errors
- Check that RLS policies are correctly configured
- Verify the authenticated user has the right permissions
- Test with the Supabase Dashboard SQL Editor

## Next Steps

1. **Implement Auth UI**: Create login/logout components using the auth service
2. **Add progress tracking**: Build UI for progress updates
3. **Enable real-time features**: Use database subscriptions for live updates
4. **Configure notifications**: Set up notification rules and delivery

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
