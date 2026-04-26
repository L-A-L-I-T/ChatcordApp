const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const conversationRoutes = require("./routes/conversations");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

dotenv.config();
require("./config/passport");
connectDB();

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
	.split(",")
	.map((s) => s.trim())
	.filter(Boolean);

const corsOptions = {
	origin: (origin, cb) => {
		if (!origin) return cb(null, true); // allow non-browser / server-to-server
		if (allowedOrigins.includes(origin)) return cb(null, true);
		return cb(new Error(`CORS blocked for origin: ${origin}`));
	},
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	credentials: true,
};

const app = express();
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
	// Required behind Render/other proxies so secure cookies are handled correctly.
	app.set("trust proxy", 1);
}

// 1. CORS must be first — before session, passport, body parsing
app.use(cors(corsOptions));

app.use(
	session({
		secret: process.env.SESSION_SECRET || "change_me_in_env",
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 24 * 60 * 60 * 1000,
			sameSite: isProduction ? "none" : "lax",
			secure: isProduction,
		},
	})
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/conversation", conversationRoutes);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname1, "/client/build")));
	// Express 5: named wildcard — serves SPA for all non-API routes
	app.get("/*splat", (req, res) =>
		res.sendFile(path.resolve(__dirname1, "client", "build", "index.html"))
	);
} else {
	app.get("/", (req, res) => {
		res.send("API is running..");
	});
}

// --------------------------deployment------------------------------

// 2. Error handlers — re-apply CORS headers so the browser can read the error
app.use((err, req, res, next) => {
	const origin = req.headers.origin;
	if (origin && allowedOrigins.includes(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
		res.setHeader("Access-Control-Allow-Credentials", "true");
	}
	next(err);
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const ONLINE_USERS_KEY = "online_users";
const userSocketsKey = (userId) => `user:${userId}:sockets`;

const addOnlineUser = async (redisClient, userId, socketId) => {
	await redisClient.sAdd(userSocketsKey(userId), socketId);
	await redisClient.sAdd(ONLINE_USERS_KEY, userId);
};

const removeOnlineUser = async (redisClient, userId, socketId) => {
	const socketSetKey = userSocketsKey(userId);
	await redisClient.sRem(socketSetKey, socketId);

	const activeConnectionCount = await redisClient.sCard(socketSetKey);
	if (activeConnectionCount === 0) {
		await redisClient.del(socketSetKey);
		await redisClient.sRem(ONLINE_USERS_KEY, userId);
	}
};

const emitOnlineUsers = async (io, redisClient) => {
	const onlineUserIds = await redisClient.sMembers(ONLINE_USERS_KEY);
	io.emit(
		"getUsers",
		onlineUserIds.map((userId) => ({ userId }))
	);
};

const startSocketServer = async () => {
	const server = app.listen(PORT, () =>
		console.log(`Server running on PORT ${PORT}...`.yellow.bold)
	);

	const io = require("socket.io")(server, {
		pingTimeout: 60000,
		cors: {
			origin: allowedOrigins,
			credentials: true,
		},
	});
	app.set("io", io);

	const pubClient = createClient({ url: REDIS_URL });
	const subClient = pubClient.duplicate();

	pubClient.on("error", (err) => console.error("Redis pub error:", err.message));
	subClient.on("error", (err) => console.error("Redis sub error:", err.message));

	await Promise.all([pubClient.connect(), subClient.connect()]);
	io.adapter(createAdapter(pubClient, subClient));
	console.log("Socket.IO Redis adapter connected".green);

	io.on("connection", (socket) => {
		console.log(`[${PORT}] socket connected:`, socket.id);
		io.emit("welcome", "Hello this is socket server");

		socket.on("addUser", async (userId) => {
			if (!userId) return;

			const normalizedUserId = String(userId);
			socket.data.userId = normalizedUserId;
			socket.join(`user:${normalizedUserId}`);
			console.log(`[${PORT}] addUser`, normalizedUserId, socket.id);

			try {
				await addOnlineUser(pubClient, normalizedUserId, socket.id);
				await emitOnlineUsers(io, pubClient);
			} catch (err) {
				console.error("Error updating user presence:", err.message);
			}
		});

		socket.on("sendMessage", ({ senderId, receiverId, text }) => {
			if (!receiverId) return;
			console.log(`[${PORT}] sendMessage ${senderId} -> ${receiverId}`);

			io.to(`user:${receiverId}`).emit("getMessage", {
				senderId,
				text,
			});
		});

		socket.on("logoutUser", async (userId) => {
			const normalizedUserId = String(userId || socket.data.userId || "");
			if (!normalizedUserId) return;

			try {
				await removeOnlineUser(pubClient, normalizedUserId, socket.id);
				await emitOnlineUsers(io, pubClient);
			} catch (err) {
				console.error("Error removing user on logout:", err.message);
			}
		});

		socket.on("disconnect", async () => {
			console.log(`[${PORT}] socket disconnected:`, socket.id);

			const userId = socket.data.userId;
			if (!userId) return;

			try {
				await removeOnlineUser(pubClient, userId, socket.id);
				await emitOnlineUsers(io, pubClient);
			} catch (err) {
				console.error("Error removing user presence:", err.message);
			}
		});
	});
};

startSocketServer().catch((err) => {
	console.error("Failed to start socket server:", err);
	process.exit(1);
});
