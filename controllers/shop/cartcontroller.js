const mongoose = require("mongoose");
const Cart = require("../../models/cart.js");
const CartItem = require("../../models/cartitems.js");
const Product = require("../../models/Product.js");

// Updated Helper function to calculate price
const calculatePrice = (
  product,
  quantity,
  height,
  width,
  length,
  materialPrice,
  productType
) => {
  let totalPrice = 0;
  let area = 0;
  const basePrice = product.salePrice || product.price;

  // Handle different product types
  if (productType === "curtains") {
    // For curtains, add material price separately as per your requirement
    if (length) {
      area = length;
      totalPrice = length * basePrice * quantity + (materialPrice || 0);
    } else {
      totalPrice = basePrice * quantity + (materialPrice || 0);
    }
  } else {
    // For wallpapers and other products, add material price to base price BEFORE multiplying by area
    const adjustedBasePrice = basePrice + (materialPrice || 0);

    if (height && width) {
      area = (height * width) / 144;
      totalPrice = area * adjustedBasePrice * quantity;
    } else if (length) {
      area = length;
      totalPrice = length * adjustedBasePrice * quantity;
    } else {
      totalPrice = adjustedBasePrice * quantity;
    }
  }

  return { totalPrice, area };
};

exports.addToCart = async (req, res) => {
  try {
    if (
      typeof req.body !== "object" ||
      req.body === null ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    let {
      userId,
      productId,
      quantity,
      height,
      width,
      length,
      selectedMaterial,
      materialPrice,
      productType,
    } = req.body;

    // Validate input types
    if (
      typeof productId !== "string" ||
      typeof quantity !== "number" ||
      (height && typeof height !== "number") ||
      (width && typeof width !== "number") ||
      (length && typeof length !== "number") ||
      (selectedMaterial && typeof selectedMaterial !== "string") ||
      (materialPrice && typeof materialPrice !== "number")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid input types",
      });
    }

    // Validate input
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Product ID",
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Use product's type if not provided in request
    if (!productType) {
      productType = product.productType || "standard";
    }

    // Calculate price with the updated formula
    const { totalPrice, area } = calculatePrice(
      product,
      quantity,
      height,
      width,
      length,
      materialPrice,
      productType
    );

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      cartId: cart._id,
      productId: product._id,
      // If there are custom options like material, include them in the matching criteria
      ...(selectedMaterial && { selectedMaterial }),
      ...(height && { height }),
      ...(width && { width }),
      ...(length && { length }),
    });

    if (cartItem) {
      // Update existing item
      cartItem.quantity += quantity;

      // Recalculate price with updated quantity
      const updatedPriceData = calculatePrice(
        product,
        cartItem.quantity,
        height || cartItem.height,
        width || cartItem.width,
        length || cartItem.length,
        materialPrice || cartItem.materialPrice,
        productType
      );

      cartItem.totalPrice = updatedPriceData.totalPrice;
      cartItem.height = height || cartItem.height;
      cartItem.width = width || cartItem.width;
      cartItem.area = updatedPriceData.area;
      cartItem.selectedMaterial = selectedMaterial || cartItem.selectedMaterial;
      cartItem.materialPrice = materialPrice || cartItem.materialPrice;
      await cartItem.save();
    } else {
      // Create new cart item
      const basePrice = product.salePrice || product.price;
      let unitPrice = basePrice;

      // For non-curtain products, include material price in the unit price
      if (productType !== "curtains" && materialPrice) {
        unitPrice = basePrice + materialPrice;
      }

      cartItem = await CartItem.create({
        cartId: cart._id,
        userId,
        productId: product._id,
        quantity,
        price: unitPrice, // Store the adjusted unit price
        totalPrice,
        height,
        width,
        area,
        selectedMaterial,
        materialPrice,
        productType: productType,
        productName: product.productName || product.title,
        image: product.image1,
      });
    }

    // Update cart totals
    const cartItems = await CartItem.find({ cartId: cart._id });
    cart.totalItems = cartItems.length;
    cart.totalAmount = cartItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    await cart.save();

    // Get updated cart items
    const updatedItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId",
      "image title price salePrice productType"
    );

    res.status(200).json({
      success: true,
      data: {
        cart,
        items: updatedItems,
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding item to cart",
      error: error.message,
    });
  }
};

exports.fetchCartItems = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          cart: { totalItems: 0, totalAmount: 0 },
          items: [],
        },
      });
    }

    const cartItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId",
      "image title price salePrice productType"
    );

    res.status(200).json({
      success: true,
      data: {
        cart,
        items: cartItems,
      },
    });
  } catch (error) {
    console.error("Fetch cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart items",
      error: error.message,
    });
  }
};

exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { userId, itemId, quantity } = req.body;

    if (!userId || !itemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID",
      });
    }

    const cartItem = await CartItem.findById(itemId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    // Get the product to have access to its properties
    const product = await Product.findById(cartItem.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Associated product not found",
      });
    }

    cartItem.quantity = quantity;

    // Use the same calculation logic for consistency
    const { totalPrice } = calculatePrice(
      product,
      quantity,
      cartItem.height,
      cartItem.width,
      cartItem.length,
      cartItem.materialPrice,
      cartItem.productType || product.productType
    );

    cartItem.totalPrice = totalPrice;
    await cartItem.save();

    // Update cart totals
    const cart = await Cart.findOne({ userId });
    const cartItems = await CartItem.find({ cartId: cart._id });
    cart.totalItems = cartItems.length;
    cart.totalAmount = cartItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    await cart.save();

    // Get updated items
    const updatedItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId",
      "image title price salePrice productType"
    );

    res.status(200).json({
      success: true,
      data: {
        cart,
        items: updatedItems,
      },
    });
  } catch (error) {
    console.error("Update quantity error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating quantity",
      error: error.message,
    });
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    // Input validation
    if (!userId || !itemId) {
      console.log("Missing userId or itemId"); // Debug log
      return res.status(400).json({
        success: false,
        message: "Invalid data provided! Missing userId or itemId",
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      console.log("Invalid ObjectId format:", itemId); // Debug log
      return res.status(400).json({
        success: false,
        message: "Invalid item ID format!",
      });
    }

    // Find the cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      console.log("Cart not found for userId:", userId); // Debug log
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    // Find and delete the cart item
    const deletedItem = await CartItem.findOneAndDelete({
      _id: itemId,
      cartId: cart._id,
    });

    if (!deletedItem) {
      console.log("Item not found:", itemId); // Debug log
      return res.status(404).json({
        success: false,
        message: "Item not found in cart!",
      });
    }

    // Update cart totals
    const remainingItems = await CartItem.find({ cartId: cart._id });
    cart.totalItems = remainingItems.length;
    cart.totalAmount = remainingItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    await cart.save();

    // Get updated cart items with product details
    const updatedItems = await CartItem.find({ cartId: cart._id }).populate(
      "productId",
      "image title price salePrice productType"
    );

    res.status(200).json({
      success: true,
      data: {
        cart,
        items: updatedItems,
      },
    });
  } catch (error) {
    console.error("Delete cart item error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting cart item",
      error: error.message,
    });
  }
};

exports.cartitemcount = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Count the items in the cart
    const itemCount = await CartItem.countDocuments({ cartId: cart._id });

    res.status(200).json({
      success: true,
      data: { itemCount },
    });
  } catch (error) {
    console.error("Count cart item error:", error);
    res.status(500).json({
      success: false,
      message: "Error counting cart items",
      error: error.message,
    });
  }
};

exports.emptyCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    await CartItem.deleteMany({ cartId: cart._id });

    cart.totalItems = 0;
    cart.totalAmount = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart emptied successfully",
    });
  } catch (error) {
    console.error("Empty cart error:", error);
    res.status(500).json({
      success: false,
      message: "Error emptying cart",
      error: error.message,
    });
  }
};
