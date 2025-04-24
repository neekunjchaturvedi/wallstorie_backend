const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../../models/orders");
const dotenv = require("dotenv");
const Cart = require("../../models/Cart");

dotenv.config({ path: "config.env" });

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create an order
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency, receipt } = req.body;

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency,
      receipt,
    };

    const order = await razorpayInstance.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify payment signature
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, orderDetails } = req.body;

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Create new order using our order schema
    const newOrder = new Order({
      userId: orderDetails.userId,
      items: orderDetails.items,
      totalAmount: orderDetails.totalAmount,
      shippingAddress: orderDetails.shippingAddress,
      paymentMethod: "Razorpay",
      paymentStatus: "Paid",
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      status: "Processing",
      specialInstructions: orderDetails.specialInstructions || "",
      promoCode: orderDetails.promoCode || "",
      promoDiscount: orderDetails.promoDiscount || 0,
    });

    // Save to database
    await newOrder.save();

    res.json({
      success: true,
      message: "Payment verified successfully",
      order: newOrder,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    });
  }
};
