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

// 1. CORS must be first — before session, passport, body parsing
app.use(cors(corsOptions));

app.use(
	session({
		secret: process.env.SESSION_SECRET || "change_me_in_env",
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 24 * 60 * 60 * 1000,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
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

let users = [];

const addUser = (userId, socketId) => {
	!users.some((user) => user.userId === userId) &&
		users.push({ userId, socketId });
};

const removeUser = (socketId) => {
	users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
	return users.find((user) => user.userId == userId);
};

io.on("connection", (socket) => {
	console.log("A user connected..", socket.id);

	io.emit("welcome", "Hello this is socket server");

	socket.on("addUser", (userId) => {
		if (userId) {
			addUser(userId, socket.id);
			io.emit("getUsers", users);
		}
		console.log("users ", users);
	});

	socket.on("sendMessage", ({ senderId, receiverId, text }) => {
		const user = getUser(receiverId);
		io.to(user?.socketId).emit("getMessage", {
			senderId,
			text,
		});
		console.log("sendMessage ", user);
	});

	socket.on("disconnect", () => {
		console.log("A user disconnected");
		removeUser(socket.id);
		io.emit("getUsers", users);
	});
});
