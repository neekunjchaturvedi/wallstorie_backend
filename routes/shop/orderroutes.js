const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  getAllOrdersByUser,
  getOrderDetails,
} = require("../../controllers/shop/ordercontroller");

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
});

router.use(limiter);
router.get("/list/:userId", limiter, getAllOrdersByUser);
router.get("/details/:id", limiter, getOrderDetails);

module.exports = router;
