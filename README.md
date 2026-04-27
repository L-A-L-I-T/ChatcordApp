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

## Local Kafka Setup (Docker)

If you do not want a managed Kafka service, you can run Kafka locally.

### 1) Start local Kafka

```bash
npm run kafka:up
```

Useful commands:

```bash
npm run kafka:logs
```

```bash
npm run kafka:ui
```

```bash
npm run kafka:ui:logs
```

```bash
npm run kafka:down
```

```bash
npm run kafka:reset
```

Kafka UI is available at:

```text
http://localhost:8080
```

In the UI, open topic `chat.messages` to inspect produced records.
`kafka:reset` removes local Kafka volume data and starts a fresh broker/UI.

### 2) Add Kafka env variables

Set these in `.env`:

```bash
KAFKA_BROKERS=localhost:29092
KAFKA_CLIENT_ID=chatcord-backend
KAFKA_MESSAGE_TOPIC=chat.messages
KAFKA_CONSUMER_GROUP=chatcord-message-writers
```

### 3) Restart backend

After setting envs, restart your backend server.

Note: if `KAFKA_BROKERS` is not set, backend falls back to direct DB write mode.

## Redis Architecture and Flow

### High-level architecture

```text
Client A (5173) ---> Server 1 (8001) ----\
                                           \        +------------------+
                                            ----->  | Redis (Upstash)  |
                                           /        | - Pub/Sub adapter|
Client B (3000) ---> Server 2 (8002) ----/         | - Presence sets  |
                                                    +------------------+
                                                              |
                                                              v
                                                     +------------------+
                                                     | MongoDB Atlas    |
                                                     | conversations/msg|
                                                     +------------------+
```

### Where Redis is used

1. **Socket.IO Redis adapter (Pub/Sub)**  
   Lets events travel across backend nodes, so users connected to different servers can still receive each other's socket events.

2. **Global online presence storage**  
   Shared Redis sets track who is online across all servers.

### Redis keys used

- `online_users` (Set): all online user IDs.
- `user:<userId>:sockets` (Set): active socket IDs for a user (multi-tab/device safe).

### Redis operations used in code

- `SADD` (`sAdd`)  
  Add user/socket to presence sets.
- `SREM` (`sRem`)  
  Remove socket/user from presence sets.
- `SCARD` (`sCard`)  
  Count active sockets for a user.
- `SMEMBERS` (`sMembers`)  
  Fetch global online users for `getUsers`.
- `DEL` (`del`)  
  Delete empty user socket set.

### Runtime flow

1. **Connect + register user** (`addUser`)  
   - socket joins room `user:<userId>`  
   - `SADD user:<userId>:sockets <socketId>`  
   - `SADD online_users <userId>`  
   - server emits updated `getUsers`

2. **Send message** (`sendMessage`)  
   - emit to room `user:<receiverId>`  
   - Redis adapter forwards event across servers if needed

3. **Add friend** (`addFriend` route)  
   - backend creates conversation in MongoDB  
   - emits `friendAdded` to both user rooms  
   - both clients refresh conversation list

4. **Logout/disconnect cleanup** (`logoutUser` or `disconnect`)  
   - `SREM user:<id>:sockets <socketId>`  
   - `SCARD user:<id>:sockets`  
   - if `0`: `DEL user:<id>:sockets` + `SREM online_users <userId>`  
   - emit updated `getUsers`
