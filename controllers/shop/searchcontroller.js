const Product = require("../../models/Product.js");
const _ = require("lodash");

const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.params;
    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Keyword is required and must be in string format",
      });
    }

    const safeKeyword = _.escapeRegExp(keyword);
    const regEx = new RegExp(safeKeyword, "i");

    const createSearchQuery = {
      $or: [
        { productName: regEx },
        { description: regEx },
        { category: regEx },
        { brand: regEx },
        { productType: regEx },
        { color: regEx },
        { trend: regEx },
        { space: regEx },
      ],
    };

    const searchResults = await Product.find(createSearchQuery).sort({
      popularity: -1,
    });

    res.status(200).json({
      success: true,
      data: searchResults,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while searching for products.",
    });
  }
};

module.exports = { searchProducts };
