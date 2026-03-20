# Dailess

Dailess is a romantic, mobile-first full-stack web app for two connected people to privately chat and share daily moments in real time.

## Stack

- Next.js 15 + React 19 + Tailwind CSS
- Express + Socket.io
- Supabase Postgres + Supabase Storage
- JWT authentication

## Features

- Secure email/password registration and login
- One-to-one partner linking with a unique invite code
- Real-time chat with typing, delivered, and seen states
- Camera-first photo capture inside the web app
- Shared daily moments feed with automatic 24-hour expiry
- Warm, cozy, mobile-first design tailored for smartphones
- Disconnect partner flow for re-pairing

## Project structure

- `web`: Next.js frontend
- `server`: Express API, Socket.io server
- `server/supabase/schema.sql`: SQL schema for Supabase
- `netlify.toml`: Netlify frontend deploy config
- `render.yaml`: Render backend deploy config

## Local environment variables

### `server/.env`

```env
JWT_SECRET=change-me-please
CLIENT_URL=http://localhost:3000
NODE_ENV=development
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=moments
PORT=4000
```

### `web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run the SQL in [server/supabase/schema.sql](./server/supabase/schema.sql).
4. In Storage, confirm the `moments` bucket exists.
5. Copy these values from Supabase:
   - Project URL
   - Service role key

Reference: https://supabase.com/docs/guides/getting-started

## Run locally

1. Install dependencies:

```bash
npm.cmd install
```

2. Create the environment files from:
   - [server/.env.example](./server/.env.example)
   - [web/.env.local.example](./web/.env.local.example)

3. Run the app:

```bash
npm.cmd run dev
```

4. Open `http://localhost:3000`.

## Deploy plan

### 1. Supabase

Use your Supabase project for both database and storage.

Backend environment variables:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=moments
```

### 2. Backend on Render

This repo includes [render.yaml](./render.yaml).

Required environment variables on Render:

```env
NODE_ENV=production
JWT_SECRET=your-long-random-secret
CLIENT_URL=https://your-netlify-site.netlify.app
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=moments
```

Health endpoint:

```text
https://your-render-service.onrender.com/api/health
```

### 3. Frontend on Netlify

This repo includes [netlify.toml](./netlify.toml).

Add these environment variables in Netlify:

```env
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-render-service.onrender.com
```

After Netlify gives you the final frontend URL, copy that URL back into Render as `CLIENT_URL`.

Reference: https://docs.netlify.com/configure-builds/file-based-configuration/

## Production notes

- The backend now uses Supabase Postgres for users, messages, and moments.
- Moment images are uploaded to Supabase Storage and returned as signed URLs.
- Expired moments are cleaned up by the backend interval and removed from both Postgres and Storage.
- Because the backend uses the Supabase service role key, keep that key server-side only. Never expose it to the frontend.

## Verification

- Backend TypeScript build passes after the Supabase migration.
- Frontend was not rebuilt in this session because local Next.js SWC execution on this machine is restricted by policy, but the public API contract used by the current UI was preserved.
