const express = require("express");
const RateLimit = require("express-rate-limit");
const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  authMiddleware,
  googleAuth,
  googleAuthCallback,
  googleAuthRedirect,
} = require("../../controllers/auth/authcontroller");

const router = express.Router();

const limiter = RateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

router.post("/register", limiter, registerUser);
router.post("/login", limiter, loginUser);
router.post("/logout", limiter, logoutUser);
router.post("/refresh", limiter, refreshAccessToken);

// Check if user is authenticated
router.get("/check-auth", limiter, authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated user!",
    user: req.user,
  });
});

// Google OAuth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback, googleAuthRedirect);

module.exports = router;
