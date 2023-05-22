require("dotenv").config();
const express = require("express");
const cors = require("cors");
const colors = require("colors");
const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");

const { errorHandler } = require("./middlewares/errorMiddleware");
const connectDB = require("./config/db");
const port = process.env.PORT || 5000;

connectDB();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// parse application/json
// app.use(bodyParser.json())

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000", "https://newsapp.vercel.app", "*"],
  })
);
// createSubscriptionPlans();

// open ai summary api endpoint

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const MAX_RETRIES = 3;

app.post("/news/summary", async (req, res) => {
  try {
    const { article } = req.body;
    let retries = 0;
    // const headers = {
    //   "Content-Type": "application/json",
    //   Authorization: `Bearer ${apiKey}`,
    // };

    // const response = await axios.post(
    //   "https://api.openai.com/v1/engines/davinci-codex/completions",
    //   {
    //     prompt: `Summarize the article: ${article}`,
    //     max_tokens: 200,
    //     top_p: 0.7,
    //     temperature: 0.3,
    //     n: 5,
    //     stop: ".",
    //   },
    //   { headers }
    // );

    while (retries < MAX_RETRIES) {
      try {
        const response = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: `Summarize the article: ${article}`,
          max_tokens: 200,
          top_p: 0.7,
          temperature: 0.3,
          n: 5,
          stop: ".",
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
        });

        const { choices } = response?.data;
        const bulletPoints = choices?.map((choice) => choice.text.trim());

        res.json({ bulletPoints });
      } catch (error) {
        if (error.response && error.response.status === 429) {
          const retryAfter = parseInt(error.response.headers["retry-after"]);
          await delay(retryAfter * 1000);
          retries++;
        } else {
          console.error("Error:", error);
          return res.status(500).json({ error: "An error occurred" });
        }
      }
    }

    return res.status(429).json({ error: "Too Many Requests" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// stripe-checkout api endpoint
app.post("/create-checkout-session", async (req, res) => {
  const { plan } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price:
            plan === "basic"
              ? process.env.BASIC_PLAN_ID
              : process.env.PRO_PLAN_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({
      url: session.url,
      sessionId: session.id,
      success: true,
      session,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/subscription", async (req, res) => {
  const { email, payment_method, priceId } = req.body;
  try {
    const customer = await stripe.customers.create({
      payment_method: payment_method,
      email: email,
      invoice_settings: {
        default_payment_method: payment_method,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      expand: ["latest_invoice.payment_intent"],
    });
    console.log("subscription", subscription);
    console.log("customer", customer);

    const status = subscription["latest_invoice"]["payment_intent"]["status"];
    const client_secret =
      subscription["latest_invoice"]["payment_intent"]["client_secret"];

    res.json({
      client_secret: client_secret,
      status: status,
      customer: customer.id,
      subscription: subscription.id,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/validity", async (req, res) => {
  try {
    const { customerId } = req.body;
    const subscription = await checkSubscriptionValidity(customerId);
    console.log("subscription", subscription);
    res.json({ isValid: subscription.status });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use("/api/news", require("./routes/newsRoutes"));
app.use("/api/auth", require("./routes/userRoutes"));

app.use(errorHandler);

app.listen(port, () => console.log(`App is running on port: ${port}`));
