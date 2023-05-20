const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  // updateUser,
} = require("../controllers/userController");
// const { protect } = require("../middlewares/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

// router.post("/update", protect, updateUser);

module.exports = router;
