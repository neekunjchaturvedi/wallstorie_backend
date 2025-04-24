const Order = require("../../models/orders");

exports.getAllOrdersOfAllUsers = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderDetailsForAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "items.productId"
    );
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    console.log(`Attempting to update order ${id} status to: ${status}`);

    const allowedStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (typeof status !== "string" || !allowedStatuses.includes(status)) {
      console.warn(`Invalid status value: ${status}`);
      return res.status(400).json({
        error: `Invalid status value. Allowed values are: ${allowedStatuses.join(
          ", "
        )}`,
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate("items.productId");

    if (!updatedOrder) {
      console.warn(`Order not found: ${id}`);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(`Successfully updated order ${id} status to: ${status}`);
    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error(`Error updating order status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
