require("dotenv").config();
var GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");
const User = require("../models/userModel");
var generator = require("generate-password");
const { uniqueUsernameGenerator } = require("unique-username-generator");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const APPURL = process.env.APP_URL || "http://localhost:8000";

passport.use(
	new GoogleStrategy(
		{
			clientID: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			callbackURL: `${APPURL}/api/user/google/callback`,
			passReqToCallback: true,
		},
		async (req, accessToken, refreshToken, profile, cb) => {
			console.log(profile);
			const id = profile.id;
			try {
				const user = await User.findOne({ googleId: id });

				if (user) {
					console.log("User Existed");
					return cb(null, user);
				}

				console.log("Hello new user");
				const password = generator.generate({
					length: 10,
					numbers: true,
					uppercase: true,
					lowercase: true,
				});
				const firstName = profile._json.given_name;
				const lastName = profile._json.family_name;
				const config = {
					dictionaries: [[firstName + lastName]],
					separator: "",
					randomDigits: 3,
					style: "lowercase",
				};
				const username = uniqueUsernameGenerator(config);

				const newUser = new User({
					googleId: profile.id,
					username,
					firstName,
					lastName,
					password,
					avatar: profile.photos?.[0]?.value,
					isAdmin: false,
				});

				await newUser.save();

				return cb(null, newUser);
			} catch (err) {
				console.log(err);
				return cb(err);
			}
		}
	)
);

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});
