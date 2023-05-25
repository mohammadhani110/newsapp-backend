require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const colors = require("colors");
const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");

const { errorHandler } = require("./middlewares/errorMiddleware");
const connectDB = require("./config/db");
const User = require("./models/userModel");
const port = process.env.PORT || 5000;

connectDB();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// parse application/json
app.use(bodyParser.json());

app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "gitahttps://newsapp-back.cyclic.app",
      "*",
    ],
  })
);
// createSubscriptionPlans();

// Assuming you have already defined the User model and configured JWT secret and expiration

// open ai summary api endpoint

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const MAX_RETRIES = 3;

app.post("/api/news/summary", async (req, res) => {
  try {
    const { article } = req.body;
    // let retries = 0;

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

    // if (retries < MAX_RETRIES) {
    //   try {
    //     const response = await openai.createCompletion({
    //       model: "text-davinci-003",
    //       prompt: `Summarize the article: ${article}`,
    //       max_tokens: 200,
    //       top_p: 0.7,
    //       temperature: 0.3,
    //       n: 5,
    //       stop: ".",
    //       frequency_penalty: 0.0,
    //       presence_penalty: 0.0,
    //     });
    //     console.log("res-->", response);
    //     const { choices } = response?.data;
    //     const bulletPoints = choices?.map((choice) => choice.text.trim());

    //     res.json({ bulletPoints });
    //   } catch (error) {
    //     if (error.response && error.response.status === 429) {
    //       const retryAfter = parseInt(error.response.headers["retry-after"]);
    //       await delay(retryAfter * 1000);
    //       retries++;
    //     } else {
    //       console.error("Error:", error);
    //       return res.status(500).json({ error: "An error occurred" });
    //     }
    //   }
    // }

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

    console.log("res-->", response);

    return res.status(200).json({ response: response.data });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred" });
  }
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post("/api/create-subscription", async (req, res) => {
  const { paymentMethodId, priceId, userId, email } = req.body;

  try {
    // Create a customer with the provided payment method
    const customer = await stripe.customers.create({
      payment_method: paymentMethodId,
      email, // Replace with customer's email
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create a subscription for the customer
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: priceId, // Replace with your Stripe Price ID
        },
      ],
      expand: ["latest_invoice.payment_intent"],
    });

    // Retrieve the payment intent associated with the subscription
    const paymentIntent = subscription.latest_invoice.payment_intent;

    // Check if the payment intent requires any additional action
    if (
      paymentIntent.status === "requires_action" &&
      paymentIntent.next_action.type === "use_stripe_sdk"
    ) {
      // Return the client secret for handling the next action on the client side
      return res.status(200).json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
      });
    } else if (paymentIntent.status === "succeeded") {
      const user = await User.findOneAndUpdate(
        { _id: userId },
        { customer: customer.id, isSubscribed: true },
        { new: true }
      );
      // Save the changes
      await user.save();
      // Subscription and payment were successful
      return res.status(200).json({ success: true });
    } else {
      // Other payment intent status, handle accordingly
      return res.status(200).json({ success: false, error: "Payment failed." });
    }
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({ success: false, error: "Server error." });
  }
});

// stripe-checkout api endpoint
// app.post("/api/create-checkout-session", async (req, res) => {
//   const { plan } = req.body;
//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       mode: "subscription",
//       line_items: [
//         {
//           price:
//             plan === "basic"
//               ? process.env.BASIC_PLAN_ID
//               : process.env.PRO_PLAN_ID,
//           quantity: 1,
//         },
//       ],
//       success_url: `${process.env.CLIENT_URL}/success`,
//       cancel_url: `${process.env.CLIENT_URL}/cancel`,
//     });

//     res.json({
//       url: session.url,
//       sessionId: session.id,
//       success: true,
//       session,
//     });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// app.post("/api/create-subscription", async (req, res) => {
//   const { email, payment_method, priceId, userId } = req.body;
//   try {
//     if (email || payment_method || priceId || userId) {
//       return res.status(500).json({ error: "Credentials missing" });
//     }
//     const customer = await stripe.customers.create({
//       payment_method: payment_method,
//       email: email,
//       invoice_settings: {
//         default_payment_method: payment_method,
//       },
//     });

//     const subscription = await stripe.subscriptions.create({
//       customer: customer.id,
//       items: [{ price: priceId }],
//       expand: ["latest_invoice.payment_intent"],
//     });

//     const user = await User.findOneAndUpdate(
//       { _id: userId },
//       { customer: customer.id, isSubscribed: true },
//       { new: true }
//     );

//     // Save the changes
//     await user.save();

//     console.log("subscription", subscription);
//     console.log("customer", customer);

//     const status = subscription["latest_invoice"]["payment_intent"]["status"];
//     const client_secret =
//       subscription["latest_invoice"]["payment_intent"]["client_secret"];

//     res.json({
//       client_secret: client_secret,
//       status: status,
//       customer: customer.id,
//       subscription: subscription.id,
//     });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

// app.post("/api/validity", async (req, res) => {
//   try {
//     const { customerId } = req.body;
//     const subscription = await checkSubscriptionValidity(customerId);
//     console.log("subscription", subscription);
//     res.json({ isValid: subscription.status });
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

app.use("/api", require("./routes/authRoutes"));
app.use("/api/news", require("./routes/newsRoutes"));
app.use("/api/auth", require("./routes/userRoutes"));

app.use(errorHandler);

app.listen(port, () => console.log(`App is running on port: ${port}`));
