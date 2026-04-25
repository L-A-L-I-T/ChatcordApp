# ChatcordApp

## Local Multi-Server Socket Test (Redis)

This project now supports multi-server socket message delivery and global online presence using Redis.

### 1) Configure Redis

Set `REDIS_URL` in your `.env`:

```bash
REDIS_URL=redis://127.0.0.1:6379
```

You can also use any managed Redis provider URL (Upstash, Redis Cloud, etc.).

### 2) Start Two Backend Instances

Run these in separate terminals:

```bash
npm run start:server1
```

```bash
npm run start:server2
```

Server ports:
- `server1` -> `8001`
- `server2` -> `8002`

### 3) Manual Simulation

Run these in separate terminals:

```bash
cd client && npm run dev:server1
```

```bash
cd client && npm run dev:server2
```

Then:
- Open User A on `http://localhost:5173` (talks to backend `8001`)
- Open User B on `http://localhost:3000` (talks to backend `8002`)
- Send message from one user to the other

Messages and online user presence should sync across both servers through Redis pub/sub.

### 4) Notes

- Session and load-balancing setup remains unchanged.
- `getUsers` socket event still returns objects shaped as `{ userId }` for frontend compatibility.
