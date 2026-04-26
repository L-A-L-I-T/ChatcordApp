const express = require("express");

const passport = require("passport");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ALLOWED_CLIENT_URLS = (
	process.env.CLIENT_URLS || process.env.CLIENT_URL || CLIENT_URL
)
	.split(",")
	.map((url) => url.trim())
	.filter(Boolean);

const router = express.Router();
const Conversation = require("../models/ConversationModel");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

const getSafeClientRedirect = (requestedUrl) => {
	if (!requestedUrl) return CLIENT_URL;

	try {
		const parsed = new URL(requestedUrl);
		const origin = parsed.origin;
		if (ALLOWED_CLIENT_URLS.includes(origin)) return origin;
	} catch (err) {
		// Ignore malformed redirect values and fallback to default.
	}

	return CLIENT_URL;
};

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
// router.get("/?search=", async (req, res) => {
// 	console.log("req body", req.body);
// 	const keyword = req.body.username
// 		? {
// 				$or: [{ username: { $regex: req.body.username, $options: "i" } }],
// 		  }
// 		: {};

// 	const users = await User.find(keyword).find({
// 		_id: { $ne: req.body.userId },
// 	});
// 	res.send(users);
// });
router.get("/", async (req, res) => {
	const userId = req.query.userId;
	console.log(userId);
	try {
		const user = await User.findById(userId);
		const { password, updatedAt, ...other } = user._doc;
		res.status(200).json(other);
	} catch (err) {
		res.status(500).json(err);
	}
});

router.get("/login/success", (req, res) => {
	if (req.user) {
		return res.status(200).json({
			success: true,
			message: "successfull",
			user: req.user,
			//   cookies: req.cookies
		});
	}

	return res.status(401).json({
		success: false,
		message: "Not authenticated",
	});
});
router.get("/logout", (req, res) => {
	req.logout(() => {
		res.redirect(CLIENT_URL);
	});
});

router.get("/google", (req, res, next) => {
	const requestedRedirect = req.query.redirect;
	const safeRedirect = getSafeClientRedirect(requestedRedirect);

	passport.authenticate("google", {
		scope: ["profile"],
		state: encodeURIComponent(safeRedirect),
	})(req, res, next);
});

router.get(
	"/google/callback",
	(req, res, next) => {
		passport.authenticate("google", (err, user) => {
			if (err || !user) {
				return res.redirect(CLIENT_URL);
			}

			req.logIn(user, (loginErr) => {
				if (loginErr) return next(loginErr);

				const stateValue = req.query.state
					? decodeURIComponent(String(req.query.state))
					: "";
				const safeRedirect = getSafeClientRedirect(stateValue);
				return res.redirect(`${safeRedirect}/chat`);
			});
		})(req, res, next);
	}
);

//Add a friend

router.put("/:id/addFriend", async (req, res) => {
	console.log("Adding Friend ", req.params.id);
	console.log("req ", JSON.stringify(req.body));
	try {
		const user = await User.findById(req.params.id);
		if (!user) return res.status(404).json("User not found");

		const friend = await User.findOne({ username: req.body?.username });
		if (!friend) {
			console.log("User dosen't exists!!");
			return res.status(404).json("Friend not found");
		}

		if (friend._id.toString() === req.params.id) {
			console.log("you cant add yourself");
			return res.status(403).json("you cant add yourself");
		}

		// Ensure `friends` is always an array
		user.friends = Array.isArray(user.friends) ? user.friends : [];
		friend.friends = Array.isArray(friend.friends) ? friend.friends : [];

		if (friend) {
			if (friend._id.toString() !== req.params.id) {
				const friendId = friend._id.toString();
				const userId = user._id.toString();

				if (!user.friends.includes(friendId)) {
					await user.updateOne({ $push: { friends: friendId } });
					await friend.updateOne({ $push: { friends: userId } });
					const newConversation = new Conversation({
						members: [friendId, userId],
					});

					try {
						await newConversation.save();
						console.log("user has been added to friends");
						res.status(200).json("user has been added to friends");
					} catch (err) {
						res.status(500).json(err);
					}
				} else {
					console.log("you are already friends");
					res.status(403).json("you are already friends");
				}
			}
		}
	} catch (err) {
		console.log(err);
		res.status(500).json(err);
	}
});

module.exports = router;
