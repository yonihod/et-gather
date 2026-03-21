# ET Gather — RTCW:ET Israel 🇮🇱

Community platform for **Wolfenstein: Enemy Territory** Israeli players. Organize gathers, track attendance, and climb the leaderboard.

🔗 **Live**: [et-gather.vercel.app](https://et-gather.vercel.app)

## Features

- **Gather System** — Create and join 5v5 or 6v6 matches. Queue fills up, teams auto-balance, game starts.
- **Attendance Leaderboard** — 10 points per completed gather. See who shows up the most.
- **Live Server Status** — Real-time player list from the community server (84.229.240.21), updated every 2 minutes.
- **Discord Login** — Sign in with Discord or email. Profile with avatar and stats.
- **Hebrew + English** — Full RTL Hebrew support, switchable to English.
- **Game Configs** — Downloadable ET configs (competitive, beginner, performance) with setup instructions.
- **Community Links** — Server IP, Discord, Telegram, Facebook group, map downloads.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Database & Auth**: Supabase (Postgres, Auth, Realtime, RLS)
- **Fonts**: Outfit (display), Rubik (body/Hebrew)
- **i18n**: next-intl (Hebrew RTL default, English)
- **Deploy**: Vercel (auto-deploy from GitHub)
- **Server Query**: GitHub Actions cron → UDP query → Supabase DB

## Getting Started

```bash
# Clone
git clone https://github.com/yonihod/et-gather.git
cd et-gather

# Install
pnpm install

# Set up env
cp .env.local.example .env.local
# Fill in your Supabase URL and anon key

# Run
pnpm dev
```

## Supabase Setup

```bash
# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push

# Push auth config
supabase config push
```

## Project Structure

```
src/
├── app/[locale]/        # Pages (home, gather, community, configs, auth, profile)
├── components/          # React components (gather, leaderboard, server, layout)
├── lib/                 # Supabase clients, gather balance algorithm
├── hooks/               # useAuth hook
├── i18n/                # next-intl routing and config
├── messages/            # he.json, en.json translations
└── types/               # TypeScript types

supabase/
├── migrations/          # SQL migrations (profiles, gathers, attendance, server_status)
└── functions/           # Edge functions

.github/workflows/
└── server-status.yml    # Cron job: query ET server → write to Supabase
```

## Community

- **Server**: 84.229.240.21
- **Discord**: [discord.gg/EpGaFjJ](https://discord.gg/EpGaFjJ)
- **Telegram**: [t.me/+ksGlgP4EVNNmN2Rk](https://t.me/+ksGlgP4EVNNmN2Rk)
- **Facebook**: [facebook.com/groups/418417468274159](https://www.facebook.com/groups/418417468274159)
- **Maps**: [limewire.com/d/CHmBU](https://limewire.com/d/CHmBU#TSMLD5YgaK)
