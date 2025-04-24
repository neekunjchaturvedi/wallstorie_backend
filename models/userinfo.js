const mongoose = require("mongoose");

const userinfoSchema = new mongoose.Schema({
  phone: {
    type: Number,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
});
module.exports = mongoose.model("Userinfo", userinfoSchema);
