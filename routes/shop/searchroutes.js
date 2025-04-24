const express = require("express");
const rateLimit = require("express-rate-limit");

const { searchProducts } = require("../../controllers/shop/searchcontroller");

const router = express.Router();


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
});


router.use(limiter);
router.get("/:keyword", limiter, searchProducts);

module.exports = router;
