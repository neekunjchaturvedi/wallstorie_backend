const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");
const dotenv = require("dotenv");
const crypto = require("crypto");
dotenv.config({ path: "config.env" });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://wallstorie-backend.onrender.com/api/auth/google/callback",
      passReqToCallback: true,
    },
    async function (req, accessToken, refreshToken, profile, done) {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          console.log("Creating new user for Google auth");
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            password:
              crypto.randomBytes(4).toString("hex") +
              crypto.randomBytes(4).toString("hex"),
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);

    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
