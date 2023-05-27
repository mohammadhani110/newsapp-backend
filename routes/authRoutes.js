const express = require("express");
const router = express.Router();

const { getRefreshToken } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

router.route("/refresh-token").post(getRefreshToken);

module.exports = router;
