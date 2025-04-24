const mongoose = require("mongoose");
const Product = require("../../models/Product.js");
const ProductReview = require("../../models/Review.js");

const addProductReview = async (req, res) => {
  try {
    const { productId, userId, userName, reviewMessage, reviewValue } =
      req.body;

    // Validate input data
    if (
      !productId ||
      !userId ||
      typeof productId !== "string" ||
      typeof userId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data.",
      });
    }

    // Convert productId to ObjectId
    const productObjectId = new mongoose.Types.ObjectId(productId);

    // Check if the user has already reviewed the product
    const existingReview = await ProductReview.findOne({
      productId: productObjectId,
      userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product!",
      });
    }

    // Add the new review
    const newReview = new ProductReview({
      productId: productObjectId,
      userId,
      userName,
      reviewMessage,
      reviewValue,
    });

    await newReview.save();

    // Calculate the new average review value
    const reviews = await ProductReview.find({ productId: productObjectId });
    const totalReviewsLength = reviews.length;
    const averageReview =
      reviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) /
      totalReviewsLength;

    // Update the product with the new average review value
    await Product.findByIdAndUpdate(productObjectId, { averageReview });

    res.status(201).json({
      success: true,
      data: newReview,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the review.",
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || typeof productId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    const reviews = await ProductReview.find({ productId: productObjectId });
    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the reviews.",
    });
  }
};

module.exports = { addProductReview, getProductReviews };
