const express = require("express");
const RateLimit = require("express-rate-limit");
const {
  getAllUserinfo,
  createUserinfo,
  fetchAllUsers,
} = require("../../controllers/auth/userinfocontroller");

const router = express.Router();

const limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});

router.get("/userinfo", limiter, getAllUserinfo);
router.get("/getusers", limiter, fetchAllUsers);
router.post("/userinfopost", createUserinfo);

module.exports = router;
