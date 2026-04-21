import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Lazy initialization of Stripe to avoid crash if key is missing
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is required");
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

app.use(express.json());

// API: Stripe Checkout session
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { eventName, ticketPrice, quantity, bookingId } = req.body;
    
    // Check for MOCK mode
    const isMock = !process.env.STRIPE_SECRET_KEY || 
                   process.env.STRIPE_SECRET_KEY.includes("mock") || 
                   process.env.STRIPE_SECRET_KEY === "369369";

    if (isMock) {
      console.log("MOCK MODE: Simulating session creation...");
      return res.json({ id: `mock_session_${Date.now()}` });
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: eventName },
            unit_amount: Math.round(ticketPrice * 100),
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${process.env.APP_URL || "http://localhost:3000"}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`,
      cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/booking-failed?booking_id=${bookingId}`,
      metadata: { bookingId },
    });

    res.json({ id: session.id });
  } catch (error: any) {
    console.error("Stripe Session Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Verify Stripe Session
app.get("/api/verify-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (sessionId.startsWith("mock_session_")) {
      return res.json({ status: "paid" });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({ status: session.payment_status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
