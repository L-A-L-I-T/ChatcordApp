const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const router = require("express").Router();

//@description     Get all Messages
//@route           GET /api/:conversationId

router.get("/:conversationId", async (req, res) => {
	try {
		const messages = await Message.find({
			conversationId: req.params.conversationId,
		});
		res.status(200).json(messages);
	} catch (err) {
		res.status(500).json(err);
	}
});

//@description     Create New Message
//@route           POST /api/

router.post("/", async (req, res) => {
	const newMessage = new Message(req.body);
	console.log(newMessage);
	try {
		const savedMessage = await newMessage.save();
		res.status(200).json(savedMessage);
	} catch (err) {
		res.status(500).json(err);
	}
});

module.exports = router;
