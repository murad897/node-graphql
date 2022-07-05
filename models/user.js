const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  avatar_url: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  token: { type: String, default: null },
});

module.exports = mongoose.model("users", userSchema);
