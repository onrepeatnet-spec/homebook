# 🏠 Homebook

Your personal home design workspace — inspiration, moodboards, products, palettes, notes, and budget tracking in one place.

Built with **Next.js 14 · Supabase · TypeScript · Tailwind CSS · PWA**

---

## 🚀 Deploy in 4 steps

### 1. Set up Supabase (free)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New project** — give it a name, set a database password, choose a region
3. Wait ~2 minutes for it to provision
4. Go to **SQL Editor** → **New Query**
5. Paste the entire contents of `supabase/migration.sql` and click **Run**
6. Go to **Project Settings → API**
7. Copy your **Project URL** and **anon/public key** — you'll need these next

---

### 2. Add environment variables

Copy the example file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Supabase values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial Homebook commit"
```

Create a new repo on [github.com](https://github.com/new), then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/homebook.git
git branch -M main
git push -u origin main
```

---

### 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your GitHub repo
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click **Deploy** — done in ~2 minutes ✓

Your app is now live at `your-project.vercel.app`

---

## 📱 Install on your phone (PWA)

Once deployed, open your Vercel URL in **Safari** (iOS) or **Chrome** (Android):

- **iOS:** Tap the Share button → **Add to Home Screen**
- **Android:** Tap the three-dot menu → **Add to Home Screen** (or Chrome will prompt automatically)

The app will appear on your home screen like a native app — full screen, no browser bar.

---

## 🛠️ Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project structure

```
homebook/
├── app/
│   ├── layout.tsx        # PWA meta, fonts
│   ├── page.tsx          # Root app + state management
│   └── globals.css       # All styles
├── components/
│   ├── Dashboard.tsx
│   ├── InspirationTab.tsx  # Masonry grid + real file upload
│   ├── MoodboardTab.tsx    # Drag-and-drop canvas
│   ├── ProductsTab.tsx
│   ├── ColoursTab.tsx
│   ├── NotesTab.tsx        # Markdown editor with auto-save
│   ├── BudgetTab.tsx
│   ├── ImageUpload.tsx     # Supabase Storage upload
│   ├── Modal.tsx
│   ├── Sidebar.tsx
│   ├── MobileNav.tsx
│   ├── Icon.tsx
│   └── pages/
│       ├── RoomPage.tsx
│       ├── AllRoomsPage.tsx
│       ├── AllInspirationPage.tsx
│       ├── AllProductsPage.tsx
│       └── BudgetOverviewPage.tsx
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── db.ts               # All database queries
│   ├── storage.ts          # Image upload/delete
│   └── types.ts            # TypeScript types
├── supabase/
│   └── migration.sql       # Run this in Supabase SQL Editor
└── public/
    └── manifest.json       # PWA manifest
```

---

## 🔮 Future features (from spec)

- [ ] AI style detection from inspiration images
- [ ] Automatic colour palette extraction from photos
- [ ] Browser extension to save inspiration
- [ ] Collaborative design (multi-user)
- [ ] 3D room planning
- [ ] Mobile camera capture

---

## 🔐 Adding authentication (optional)

The app currently allows open access (good for personal use on a private URL). To add login:

1. Enable **Email Auth** in Supabase Dashboard → Authentication
2. Update the RLS policies in `migration.sql` to use `auth.uid()`
3. Add a login page using `@supabase/ssr`
