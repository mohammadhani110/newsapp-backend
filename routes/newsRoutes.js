const express = require("express");
const router = express.Router();

const {
  getLatestArticles,
  getTopArticles,
  getArticleCategories,
  getArticlesByCategory,
  // getArticlesSummary,
} = require("../controllers/newsController");
const { protect } = require("../middlewares/authMiddleware");

//chaining same route for different requests
router.route("/latest").get(protect, getLatestArticles);
router.route("/top").get(protect, getTopArticles);
router.route("/categories").get(protect, getArticleCategories);
router.route("/by-category/:category").get(protect, getArticlesByCategory);
// router.route("/summarize").post(protect, getArticlesSummary);

module.exports = router;
