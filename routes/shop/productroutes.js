const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  getWallpaper,
  getWallpaperrolls,
  getblinds,
  getcur,
  getbycategory,
  getproductbyid,
  getartist,
} = require("../../controllers/shop/productcontroller");

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
});

router.use(limiter);

router.get("/get", limiter, getWallpaper);
router.get("/getr", limiter, getWallpaperrolls);
router.get("/getb", limiter, getblinds);
router.get("/getc", limiter, getcur);
router.get("/getartist", limiter, getartist);
router.get("/category", limiter, getbycategory);
router.get("/get/:id", limiter, getproductbyid);

module.exports = router;
