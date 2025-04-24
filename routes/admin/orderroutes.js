const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  getAllOrdersOfAllUsers,
  getOrderDetailsForAdmin,
  updateOrderStatus,
} = require("../../controllers/admin/ordercontrolleradmin");

const router = express.Router();


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
});

router.use(limiter);

router.get("/get", limiter, getAllOrdersOfAllUsers);
router.get("/details/:id", limiter, getOrderDetailsForAdmin);
router.put("/update/:id", limiter, updateOrderStatus);

module.exports = router;
