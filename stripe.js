const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// async function createSubscriptionPlans() {
//   try {
//     // Create Basic plan
//     const basicPlan = await stripe.products.create({
//       name: "Basic Plan",
//       type: "service",
//       id: process.env.BASIC_PLAN_ID,
//     });

//     await stripe.prices.create({
//       product: process.env.BASIC_PLAN_ID,
//       unit_amount: 5000, // Amount in cents
//       currency: "usd",
//       recurring: { interval: "month" },
//     });

//     // Create Pro plan
//     const proPlan = await stripe.products.create({
//       name: "Pro Plan",
//       type: "service",
//       id: process.env.PRO_PLAN_ID,
//     });

//     await stripe.prices.create({
//       product: process.env.PRO_PLAN_ID,
//       unit_amount: 14000, // Amount in cents
//       currency: "usd",
//       recurring: { interval: "month" },
//     });

//     console.log("Subscription plans created successfully.");
//   } catch (error) {
//     console.error("Error creating subscription plans:", error);
//   }
// }
// async function getProductsList() {
//   const products = await stripe.products.list({
//     limit: 3,
//   });

//   const prices = await stripe.prices.list({
//     limit: 3,
//   });
//   console.log("products", products);
//   console.log("prices", prices);
// }

async function checkSubscriptionValidity(customerId) {
  try {
    // Retrieve customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1, // Limit to one subscription per customer
    });

    if (subscriptions.data.length === 0) {
      // User has no active subscription
      console.log("User has no active subscription");
      return;
    }

    const subscription = subscriptions.data[0];

    // Check subscription status
    if (subscription.status === "active") {
      console.log("User subscription is valid");
    } else {
      console.log("User subscription is not active");
    }

    return subscription;
  } catch (error) {
    console.error("Error checking subscription validity:", error);
  }
}

module.exports = {
  // createSubscriptionPlans,
  // getProductsList,
  checkSubscriptionValidity,
};
