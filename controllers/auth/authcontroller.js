const bcrypt = require("bcryptjs");
const User = require("../../models/user");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const passport = require("passport");
dotenv.config({ path: "config.env" });

// Token Expiry Config
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

// Register User
const registerUser = async (req, res) => {
  const { name, phone, email, password } = req.body;

  try {
    const checkUser = await User.findOne({ email: { $eq: email } });
    if (checkUser) {
      return res.json({ success: false, message: "User already exists!" });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ name, phone, email, password: hashPassword });

    await newUser.save();
    res.status(200).json({ success: true, message: "Registration successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Some error occurred" });
  }
};

// Login User
const loginUser = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    let checkUser = isNaN(identifier)
      ? await User.findOne({ email: { $eq: identifier } })
      : await User.findOne({ phone: { $eq: identifier } });

    if (!checkUser) {
      return res.json({ success: false, message: "User doesn't exist!" });
    }

    const checkPasswordMatch = await bcrypt.compare(
      password,
      checkUser.password
    );
    if (!checkPasswordMatch) {
      return res.json({ success: false, message: "Incorrect password!" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(checkUser);
    const refreshToken = generateRefreshToken(checkUser);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/auth/refresh-token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Logged in successfully",
      accessToken,
      user: {
        email: checkUser.email,
        role: checkUser.role,
        id: checkUser._id,
        name: checkUser.name,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Some error occurred" });
  }
};

const refreshAccessToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Unauthorized!" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = generateAccessToken({ _id: decoded.id });

    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ success: false, message: "Unauthorized!" });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie("refreshToken", { path: "/auth/refresh-token" });
  res.json({ success: true, message: "Logged out successfully!" });
};

// Middleware to check if user is authenticated
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized! No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized! Invalid token." });
  }
};

// Google auth route
const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// Google auth callback route
const googleAuthCallback = passport.authenticate("google", {
  failureRedirect: "/login?googleLogin=failure",
});

// Handle successful Google authentication
const googleAuthRedirect = (req, res) => {
  try {
    // Generate tokens for the authenticated user
    if (!req.user) {
      console.error("No user found in request after Google authentication");
      return res.redirect(
        "http://localhost:5173/auth/login?googleLogin=failure"
      );
    }

    const accessToken = generateAccessToken(req.user);
    const refreshToken = generateRefreshToken(req.user);

    // Set refresh token as cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax", // Changed to Lax for cross-site redirect
      path: "/auth/refresh-token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Set access token in local storage by redirecting with a parameter
    res.redirect(
      `http://localhost:5173/auth/login?googleLogin=success&token=${accessToken}`
    );
  } catch (error) {
    console.error("Error in googleAuthRedirect:", error);
    res.redirect("http://localhost:5173/auth/login?googleLogin=failure");
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  authMiddleware,
  googleAuth,
  googleAuthCallback,
  googleAuthRedirect,
};
