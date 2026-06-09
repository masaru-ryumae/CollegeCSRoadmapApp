# Supabase Schema Documentation

This document describes the database schema required for the College CS Roadmap App with admin features.

## Tables

### users
User account and profile information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  signup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Unique identifier for the user
- `email`: User's email address (unique)
- `role`: User role - 'user' or 'admin' (default: 'user')
- `signup_date`: When the user first signed up
- `last_active`: Last time the user was active
- `banned`: Whether the user is banned from the app
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp

**Indexes:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_banned ON users(banned);
```

---

### resources
Learning resources (YouTube videos, LeetCode links, documentation, etc.)

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('YouTube', 'LeetCode', 'Docs', 'Community')) NOT NULL,
  url TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  featured BOOLEAN DEFAULT FALSE,
  approved BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Unique resource identifier
- `module`: Associated module/topic (e.g., "Data Structures")
- `type`: Resource type (YouTube, LeetCode, Docs, Community)
- `url`: URL to the resource
- `title`: Resource title
- `description`: Detailed description
- `featured`: Whether this resource is featured
- `approved`: Whether admin has approved this resource
- `created_by`: User who created/submitted the resource
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Indexes:**
```sql
CREATE INDEX idx_resources_module ON resources(module);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_approved ON resources(approved);
CREATE INDEX idx_resources_featured ON resources(featured);
```

---

### resource_suggestions
User-submitted resource suggestions awaiting admin review.

```sql
CREATE TABLE resource_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('YouTube', 'LeetCode', 'Docs', 'Community')) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  rejection_feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Unique suggestion identifier
- `title`: Suggested resource title
- `type`: Resource type
- `url`: Resource URL
- `description`: Description of the resource
- `user_id`: User who submitted the suggestion
- `status`: Current status (pending, approved, rejected)
- `rejection_feedback`: Reason for rejection if applicable
- `created_at`: Submission timestamp
- `updated_at`: Last update timestamp

**Indexes:**
```sql
CREATE INDEX idx_suggestions_user_id ON resource_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON resource_suggestions(status);
```

---

### invite_codes
Invite codes for registration or special access.

```sql
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  max_uses INTEGER NOT NULL,
  current_uses INTEGER DEFAULT 0,
  expiration_date DATE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
- `id`: Unique code identifier
- `code`: The actual invite code string
- `max_uses`: Maximum number of times this code can be used
- `current_uses`: Current number of times used
- `expiration_date`: Date when the code expires
- `active`: Whether the code is currently active
- `created_by`: Admin who created the code
- `created_at`: Creation timestamp

**Indexes:**
```sql
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_active ON invite_codes(active);
```

---

### user_progress
User progress tracking for each module.

```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  module_id VARCHAR(255) NOT NULL,
  completed_key_points TEXT[] DEFAULT '{}',
  current_key_point_index INTEGER DEFAULT 0,
  status VARCHAR(50) CHECK (status IN ('pending', 'in-progress', 'done')) DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, module_id)
);
```

**Columns:**
- `id`: Unique progress record identifier
- `user_id`: User reference
- `module_id`: Module being tracked
- `completed_key_points`: Array of completed key points
- `current_key_point_index`: Current position in module
- `status`: Module status (pending, in-progress, done)
- `started_at`: When user started the module
- `completed_at`: When user completed the module
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Indexes:**
```sql
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
```

---

## Row Level Security (RLS) Policies

### users table
- Users can read their own profile and all user emails
- Admins can read/update all user records
- Users cannot delete their own records (only admins can)

### resources table
- All authenticated users can read approved resources
- Admins can create, read, update, delete all resources
- Users can only create (but not edit) resources (pending approval)

### resource_suggestions table
- Users can read their own suggestions
- Admins can read/update all suggestions
- Users can create new suggestions

### invite_codes table
- Only admins can create, read, update, delete invite codes

### user_progress table
- Users can only read/update their own progress
- Admins can read all progress

---

## Migrations

To set up this schema in Supabase:

1. Create the tables in the order listed above
2. Create the indexes for each table
3. Set up Row Level Security policies
4. Grant appropriate permissions

See the individual SQL statements above for each table creation.
