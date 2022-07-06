const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

const verifyToken = async (req, res, next) => {
  // Get auth header value
  const bearerHeader = req.headers["authorization"];

  // Check if bearer is undefined
  if (typeof bearerHeader === "undefined") {
    // Split at the space
    // Forbidden
    return res.status(403).send({
      message: "token is required",
    });
  }
  const bearer = bearerHeader.split(" ");
  // Get token from array
  const token = bearer[1];
  console.log(token);
  // Set the token
  const currentUser = await User.findOne({ token });
  if (!currentUser) {
    return res.status(403).send("token is not valid");
  }
  //request to mongodb
  req.user = currentUser;
  console.log(currentUser._id);

  // Next middleware
  next();
};

module.exports = {
  verifyToken,
};
