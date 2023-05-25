const express = require("express");
const router = express.Router();

const { getRefreshToken } = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");

router.route("/refresh-token").post(authenticate, getRefreshToken);

module.exports = router;
