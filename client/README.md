# devArena — Client

The Next.js frontend for **devArena**, a competitive engineering platform where
developers battle in real-time DSA, bug-fix, backend, frontend, fullstack and
prompt-war challenges.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**,
**Tailwind CSS v4**, **TanStack Query** and **Zustand**. The design system lives
in `src/app/globals.css` (light + dark teal theme) and `src/lib/theme.ts`.

## Getting started

1. Make sure the backend (`../backendserver`) is running — it defaults to
   `http://localhost:8000` and sets httpOnly auth cookies for `localhost:3000`.

2. Configure the API URLs in `.env.local` (already scaffolded):

   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
   ```

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Structure

```
src/
├── app/
│   ├── page.tsx              Landing page
│   ├── (auth)/               login · signup (+OTP) · forgot-password
│   └── (app)/                Authenticated shell + routes
│       ├── dashboard/        Per-mode ratings + recent matches
│       ├── battle/           Create / join room + live lobby [roomCode]
│       ├── leaderboard/      Global rankings by battle mode
│       ├── matches/          Match history + live banner
│       ├── profile/[username]/  Public profile, ratings, achievements
│       ├── friends/          Requests, search, friend list
│       ├── notifications/    Inbox
│       └── settings/         Profile, password, email, danger zone
├── components/
│   ├── ui.tsx                Design-system primitives
│   ├── app-shell.tsx         Sidebar layout + auth guard
│   └── providers.tsx         React Query + auth bootstrap
├── lib/
│   ├── api.ts                Fetch wrapper (cookie auth + token refresh)
│   ├── types.ts              API types mirroring the backend
│   ├── theme.ts              Battle-mode + Elo-tier colour maps
│   ├── countries.ts          Country selector list
│   └── utils.ts              cn, timeAgo, flags…
└── stores/
    └── auth-store.ts         Zustand auth store
```

## Auth model

Authentication is cookie-based: the backend sets httpOnly `accessToken` /
`refreshToken` cookies, so the client never handles tokens directly. `lib/api.ts`
sends `credentials: "include"` on every request and transparently retries once
through `/user/refresh-token` on a `401`. `providers.tsx` calls `/user/me` on load
to hydrate the session; `app-shell.tsx` redirects guests to `/login`.
