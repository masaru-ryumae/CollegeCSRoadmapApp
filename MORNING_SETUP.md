# Morning Setup Guide (20 min)

**Goal**: Get v2.0 live by breakfast time ☕

Follow these steps in order. No skipping.

---

## Step 1: Supabase Project (5 min)

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free tier)
3. Create project:
   - Name: `college-cs-roadmap-app`
   - Password: (save securely)
   - Region: closest to you
4. Wait for project to initialize (~2 min)
5. Go to **Settings → API**
6. Copy these two values:
   ```
   Project URL: https://xxxxx.supabase.co
   Anon Key: eyJxxxxxxxxx
   ```

---

## Step 2: Add Environment Variables (3 min)

1. In `/CollegeCSRoadmapApp/roadmap-app`, create `.env.local`:
   ```bash
   cp docs/.env.local.template .env.local
   ```

2. Edit `.env.local` and paste:
   ```
   REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJxxxxxxxxx
   ```

3. Save file

**Note**: Don't commit `.env.local` (it's in `.gitignore`)

---

## Step 3: Database Schema (5 min)

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Copy all SQL from: `roadmap-app/docs/SUPABASE_SCHEMA.md`
4. Paste into SQL editor
5. Click **Run**
6. Wait for "Success" message

**Verify**: Go to **Database → Tables**
- Should see: `users`, `progress`, `resources`, `resource_suggestions`, `notifications`, `invite_codes`

---

## Step 4: Enable Google OAuth (2 min)

In Supabase:

1. Go to **Authentication → Providers**
2. Find **Google**
3. Enable it (toggle on)
4. For MVP testing: Use default test credentials (they're pre-filled)
5. Click **Save**

**For production later**: Replace with your own Google OAuth keys from [console.cloud.google.com](https://console.cloud.google.com)

---

## Step 5: Build & Deploy (5 min)

```bash
cd roadmap-app
npm install
npm run build
```

Expected output:
```
✓ 38 modules
✓ 84.63 KB gzipped
✓ dist/ folder ready
```

### Deploy to GitHub Pages:
```bash
git checkout develop
git push origin develop:main
# GitHub Actions auto-deploys
# Live in 2-3 minutes
```

### Or Vercel:
```bash
# Connect your GitHub repo to Vercel
# Auto-deploys on every push
```

### Or Netlify:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir dist
```

---

## Step 6: Verify It's Live ✅

1. Open your live URL in browser
2. You should see: **"CS Internship Roadmap"** title
3. Click **"Start Assessment"**
4. Complete 5 questions
5. Should show timeline (all working!)

If you see errors:
- Check `.env.local` has correct Supabase keys
- Check Supabase tables were created
- Check browser console for errors (F12)

---

## Step 7: Set Up Admin Account (2 min)

1. Sign in with Google OAuth
2. Go to Supabase → SQL Editor
3. Run this query:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```
4. Refresh app
5. You should now see **/admin** link in nav

---

## Optional: Enable Email Notifications (3 min)

If you want email notifications (for non-MVP):

1. Sign up at [SendGrid](https://sendgrid.com) (free tier)
2. Get API key from settings
3. Add to `.env.local`:
   ```
   REACT_APP_SENDGRID_API_KEY=xxx
   ```
4. Rebuild: `npm run build` → redeploy

For MVP: In-app notifications work immediately ✅

---

## Optional: Test Mobile App (5 min)

1. Go to `/roadmap-mobile`
2. Install Expo Go on your phone
3. Run: `npm start`
4. Scan QR code with Expo Go
5. App loads on your phone!

---

## Troubleshooting

**"Supabase keys not working"**
- Double-check you copied the **Anon Key**, not the Service Role key
- Supabase takes 1-2 min to initialize, wait longer

**"Google OAuth not showing"**
- Make sure you enabled the provider in Supabase
- Clear browser cache (Ctrl+Shift+Delete)

**"Database tables missing"**
- Copy ALL SQL from SUPABASE_SCHEMA.md (not just first part)
- Run entire script in one execution

**Build fails**
- Run `npm install` first
- Delete `node_modules/` and `.next/` if errors persist
- Check Node version: `node -v` (should be 16+)

---

## What You've Built

✅ **Web App** (React + Vite)
- Real-time progress tracking
- Admin panel
- Notifications
- Works offline

✅ **Mobile App** (Expo/React Native)
- iOS, Android, web support
- Same features as web

✅ **Backend** (Supabase)
- PostgreSQL database
- Real-time subscriptions
- Google OAuth
- Row-level security

✅ **Infrastructure**
- GitHub Pages / Vercel / Netlify
- Auto-scaling
- Global CDN

---

## Next Steps (This Week)

- [ ] Invite beta testers
- [ ] Collect feedback
- [ ] Fix any bugs
- [ ] Add real Google OAuth keys (production)
- [ ] Launch on ProductHunt
- [ ] Share on social media

---

## You're Done! 🚀

The app is live. Go get some coffee ☕

**Status**: v2.0 MVP READY FOR PRODUCTION

Questions? Check `/docs` folder or the code comments.

---

**Last Updated**: 2026-06-09
**Time to Complete**: 20 minutes
**Difficulty**: Easy (copy-paste steps)
