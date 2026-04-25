const mongoose = require("mongoose");
const colors = require("colors");
require("dotenv").config();
const connectDB = async () => {
	console.log(process.env.MONGODB_URL);
	try {
		const conn = await mongoose.connect(process.env.MONGODB_URL);

		console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
	} catch (error) {
		console.log("in catch block");
		console.log(`Error: ${error.message}`.red.bold);
		process.exit();
	}
};

module.exports = connectDB;
