# DJ Event Hub

A comprehensive DJ event management platform covering the full event lifecycle — from initial planning and marketing to day-of coordination and post-event media.

## Features

### 🎵 Event Planning
- Multi-step event creation (basics, venue, details)
- DJ lineup management with photos, bios, Instagram handles, and set times
- Music genre tagging
- Venue and capacity management
- Schedule builder with color-coded timeline

### 📣 Marketing Tools
- **Flyer Asset Manager** — Upload DJ photos, logos, and venue shots for your flyer designer
- **Social Post Composer** — Draft Instagram, Facebook, Twitter, and TikTok posts
- **Auto-generated captions** — One-click caption generator using event details and DJ handles
- Copy-to-clipboard for all post content

### 👥 Multi-Role Team Collaboration
- Role-based access: Organizer, DJ, Photographer, Marketing, Staff
- Invite team members by email
- Per-role permissions across all features

### 💬 Team Chat
- Real-time polling-based messaging per event
- Announcement mode for important broadcasts
- Live/paused refresh toggle

### ✅ Task Management
- Kanban board with TODO / IN PROGRESS / DONE / BLOCKED columns
- Priority levels (Low, Medium, High, Urgent)
- Task categories (Marketing, Logistics, Technical, Venue, Creative)
- Assign tasks to team members with due dates

### ⏱ Day-Of Management
- Live clock with current and next schedule items highlighted
- One-click schedule item completion
- Quick announcement broadcast to the team

### 📸 Post-Event Media
- Photo and video upload (drag & drop or URL)
- Featured media marking
- Instagram posting tracker with caption composer
- Media gallery with filtering

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your NEXTAUTH_SECRET

# Initialize database and seed demo data
npm run setup

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| organizer@demo.com | demo1234 | Organizer |
| dj@demo.com | demo1234 | DJ |
| photo@demo.com | demo1234 | Photographer |
| marketing@demo.com | demo1234 | Marketing |

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3 with custom dark DJ theme
- **Database**: SQLite via Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **Icons**: Lucide React
- **File uploads**: Local filesystem (public/uploads/)

## Project Structure

```
src/
├── app/
│   ├── (app)/            # Authenticated app pages
│   │   ├── dashboard/    # Personal dashboard
│   │   ├── events/       # Event management
│   │   │   └── [id]/     # Event workspace (8 sections)
│   │   └── profile/      # User profile
│   ├── api/              # REST API routes
│   ├── login/            # Auth pages
│   └── register/
├── components/
│   └── layout/           # Sidebar, event nav
├── lib/                  # Prisma, auth, utils
└── types/                # TypeScript types
```

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```
