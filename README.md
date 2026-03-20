# Dailess

Dailess is a romantic, mobile-first full-stack web app for two connected people to privately chat and share daily moments in real time.

## Stack

- Next.js 15 + React 19 + Tailwind CSS
- Express + Socket.io + MongoDB + Mongoose
- JWT authentication
- Temporary image storage with 24-hour expiry

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
- `netlify.toml`: Netlify frontend deploy config
- `render.yaml`: Render backend deploy config

## Local environment variables

### `server/.env`

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/dailess
JWT_SECRET=change-me-please
CLIENT_URL=http://localhost:3000
UPLOAD_DIR=uploads
NODE_ENV=development
```

### `web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Run locally

1. Install dependencies:

```bash
npm.cmd install
```

2. Create the environment files shown above.

3. Run the app:

```bash
npm.cmd run dev
```

4. Open `http://localhost:3000`.

## Deploy plan

### 1. MongoDB Atlas

Create an Atlas cluster and copy its connection string.

Set your backend connection string in this format:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER_URL/dailess?retryWrites=true&w=majority
```

Reference: https://www.mongodb.com/docs/manual/reference/connection-string/index.html

### 2. Backend on Render

This repo includes [render.yaml](./render.yaml).

Create a new Render Blueprint or Web Service from this repository.

Required environment variables on Render:

```env
NODE_ENV=production
JWT_SECRET=your-long-random-secret
MONGODB_URI=your-atlas-connection-string
CLIENT_URL=https://your-netlify-site.netlify.app
UPLOAD_DIR=uploads
```

Use the backend health endpoint to confirm deployment:

```text
https://your-render-service.onrender.com/api/health
```

### 3. Frontend on Netlify

This repo includes [netlify.toml](./netlify.toml).

Connect the repository to Netlify. The config uses `web` as the base directory.

Add these environment variables in Netlify:

```env
NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-render-service.onrender.com
```

After Netlify gives you the final frontend URL, copy that URL back into Render as `CLIENT_URL`.

Reference: https://docs.netlify.com/configure-builds/file-based-configuration/

## Production notes

- In production, the server will not fall back to `mongodb-memory-server`. A real Atlas connection is required.
- Image uploads are currently stored on the backend filesystem. This is acceptable for a first deployment, but Render disks are not ideal for long-term media retention. For stronger production durability, move uploads to Cloudinary, S3, or another object store.
- Captured photos are sent directly from the in-app camera flow and are not saved by the app to the device gallery.
- Moment records expire automatically after 24 hours with a MongoDB TTL index.

## Platform notes

- Netlify is suitable here for the Next.js frontend.
- Render is suitable for the persistent Node.js + Socket.io backend.
- MongoDB Atlas is the recommended production database for this stack.
