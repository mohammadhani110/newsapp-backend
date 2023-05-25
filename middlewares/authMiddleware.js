const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from headers
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not Authorized");
    }
  }

  if (!token) {
    res.status(201);
    throw new Error("Not Authorized, no token");
  }
});

const authenticate = (req, res, next) => {
  // Check for the access token in the request headers or query parameters
  const accessToken =
    req.headers.authorization?.split(" ")[1] || req.query.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: "Access token not found" });
  }

  // Verify the access token
  jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // If the access token is invalid, try to refresh the token
      return refreshAccessToken(req, res, next);
    }

    // Access token is valid, set the decoded user data on the request object
    req.userId = decoded.userId;
    next();
  });
};

const refreshAccessToken = (req, res, next) => {
  // Send a request to the refresh token route to get a new access token
  const refreshToken = req.headers["x-refresh-token"];

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token not found" });
  }

  // Make a POST request to the /refresh-token route
  fetch("/refresh-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-refresh-token": refreshToken,
    },
    body: JSON.stringify({ refreshToken }),
  })
    .then((response) => response.json())
    .then((data) => {
      // If a new access token is received, set it in the request headers and proceed
      req.headers.authorization = `Bearer ${data.accessToken}`;
      next();
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    });
};

module.exports = { protect, authenticate };
