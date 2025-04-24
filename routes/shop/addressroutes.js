const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  addAddress,
  fetchAllAddress,
  editAddress,
  deleteAddress,
} = require("../../controllers/shop/addresscontroller");

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 

  max: 100, 
});

router.post("/add", limiter, addAddress);
router.get("/get/:userId", limiter, fetchAllAddress);
router.delete("/delete/:userId/:addressId", limiter, deleteAddress);
router.put("/update/:userId/:addressId", limiter, editAddress);
module.exports = router;
