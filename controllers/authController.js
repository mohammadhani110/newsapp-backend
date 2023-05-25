const express = require("express");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// Assuming you have already defined the User model and configured JWT secret and expiration

// Refresh Token Route
const getRefreshToken = asyncHandler(async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify the provided refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      // Generate a new access token
      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      // Return the new access token
      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = {
  getRefreshToken,
};
