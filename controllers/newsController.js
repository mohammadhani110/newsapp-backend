const axios = require("axios");

const asyncHandler = require("express-async-handler");

const apiKey = process.env.NEWS_API_KEY;

const getLatestArticles = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?popularity&apiKey=${apiKey}`
    );

    const articles = response.data.articles;

    res.json({ articles });
  } catch (error) {
    console.error("Error:", error.response.data);
    res.status(500).json({ error: "An error occurred" });
  }
});

const getTopArticles = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}&pageSize=5`
    );

    const articles = response.data.articles;

    res.json({ articles });
  } catch (error) {
    console.error("Error:", error.response.data);
    res.status(500).json({ error: "An error occurred" });
  }
});

//skip
const getArticleCategories = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/sources?apiKey=${apiKey}`
    );

    const categories = response.data.sources.map((source) => source.category);
    const uniqueCategories = [...new Set(categories)];

    res.json({ categories: uniqueCategories });
  } catch (error) {
    console.error("Error:", error.response.data);
    res.status(500).json({ error: "An error occurred" });
  }
});
//skip

const getArticlesByCategory = asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${apiKey}`
    );

    const articles = response.data.articles;

    res.json({ articles });
  } catch (error) {
    console.error("Error:", error.response.data);
    res.status(500).json({ error: "An error occurred" });
  }
});

// open ai article summary
const getArticlesSummary = asyncHandler(async (req, res) => {
  try {
    const { article } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await axios.post(
      "https://api.openai.com/v1/engines/davinci-codex/completions",
      {
        prompt: `Summarize the article: ${article}`,
        max_tokens: 100,
        top_p: 0.7,
        temperature: 0.3,
        n: 5, // Number of bullet points you want
        stop: ".",
      },
      { headers }
    );

    const { choices } = response.data;
    const bulletPoints = choices.map((choice) => choice.text.trim());

    res.json({ bulletPoints });
  } catch (error) {
    console.error("Error:", error.response.data);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = {
  getLatestArticles,
  getTopArticles,
  getArticleCategories,
  getArticlesByCategory,
  getArticlesSummary,
};
