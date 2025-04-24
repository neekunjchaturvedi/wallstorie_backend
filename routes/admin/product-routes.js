const express = require("express");
const RateLimit = require("express-rate-limit");

const {
  handleImageUpload,
  addProduct,
  editProduct,
  fetchAllProducts,
  deleteProduct,
} = require("../../controllers/admin/productcontollers");

const { upload } = require("../../helpers/cloudinary");

const router = express.Router();

const limiter = RateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
});

router.post("/upload-image", upload.single("file"), handleImageUpload);
router.post("/add", limiter, addProduct);
router.put("/edit/:id", limiter, editProduct);
router.delete("/delete/:id", limiter, deleteProduct);
router.get("/get", limiter, fetchAllProducts);

module.exports = router;
