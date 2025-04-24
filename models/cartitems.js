const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
      index: true, // Add index for better query performance
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    height: Number,
    width: Number,
    area: Number,
    selectedMaterial: String,
    materialPrice: Number,
    productType: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    image: String,
  },
  { timestamps: true }
);

// Compound index to ensure unique product per cart
cartItemSchema.index({ cartId: 1, userId: 1 });

module.exports = mongoose.model("CartItem", cartItemSchema);
