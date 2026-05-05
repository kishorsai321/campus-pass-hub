import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
const PORT = 3000;

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_pass_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("DB Config Loaded:", {
    host: process.env.DB_HOST || '127.0.0.1 (default)',
    user: process.env.DB_USER || 'root (default)',
    db: process.env.DB_NAME || 'campus_pass_db (default)',
    port: process.env.DB_PORT || '3306 (default)'
});

// Helper to test DB connection
let isDbConnected = false;
let dbError: string | null = null;

async function testDbConnection() {
  try {
    console.log("------------------------------------------");
    console.log("🔍 Attempting MySQL connection...");
    console.log(`📡 Host: ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
    console.log(`👤 User: ${process.env.DB_USER || 'root'}`);
    console.log(`📂 Database: ${process.env.DB_NAME || 'campus_pass_db'}`);
    
    const connection = await pool.getConnection();
    console.log("✅ MySQL Database connected successfully.");
    
    // Auto-create tables if they don't exist
    console.log("🛠️ Initializing tables...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        dateTime VARCHAR(100),
        venue VARCHAR(255),
        price DECIMAL(10, 2),
        totalTickets INT,
        availableTickets INT,
        lat DECIMAL(10, 8),
        lng DECIMAL(11, 8),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eventId INT,
        eventName VARCHAR(255),
        userName VARCHAR(255),
        userEmail VARCHAR(255),
        userDepartment VARCHAR(100),
        ticketsCount INT,
        totalAmount DECIMAL(10, 2),
        paymentStatus ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
        bookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255)
      )
    `);

    // Check if seeded
    const [rows]: any = await connection.query("SELECT COUNT(*) as count FROM events");
    if (rows[0].count === 0) {
      console.log("🌱 Seeding initial event...");
      await connection.query(`
        INSERT INTO events (name, department, dateTime, venue, price, totalTickets, availableTickets, lat, lng)
        VALUES ('Global Tech Seminar 2026', 'Computer Science', 'May 15, 2026 • 10:00 AM', 'Main Auditorium', 25.00, 250, 250, 17.3850, 78.4867)
      `);
    }

    console.log("✅ MySQL Tables & Seed data ready.");
    console.log("------------------------------------------");
    isDbConnected = true;
    dbError = null;
    connection.release();
  } catch (err: any) {
    console.error("------------------------------------------");
    console.error("❌ MySQL Connection Failed!");
    console.error("Code:", err.code);
    console.error("Error Number:", err.errno);
    console.error("Message:", err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.warn("👉 SUGGESTION: No database server found at this address. Is MySQL running?");
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.warn("👉 SUGGESTION: Invalid credentials. Please check DB_USER and DB_PASSWORD.");
    } else if (err.code === 'ENOTFOUND') {
      console.warn("👉 SUGGESTION: Hostname not found. Check your DB_HOST setting.");
    }
    
    console.warn("App is running with LOCAL MOCK DATA until DB is fixed.");
    console.log("------------------------------------------");
    isDbConnected = false;
    dbError = `${err.code}: ${err.message}`;
  }
}
testDbConnection();

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: isDbConnected ? "connected" : "failed",
    error: dbError,
    config: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        db: process.env.DB_NAME || 'campus_pass_db'
    }
  });
});

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

// --- MySQL API Endpoints ---

// Get all events
app.get("/api/events", async (req, res) => {
  if (!isDbConnected) {
    return res.json([{
      id: 1,
      name: "Campus Tech Seminar (Demo Mode)",
      department: "Computer Science",
      dateTime: "May 15, 2026 • 10:00 AM",
      venue: "Main Auditorium",
      price: 25.00,
      totalTickets: 250,
      availableTickets: 250,
      lat: 17.3850,
      lng: 78.4867
    }]);
  }
  try {
    const [rows] = await pool.query("SELECT * FROM events ORDER BY id DESC");
    res.json(rows);
  } catch (err: any) {
    console.error("DB Error (Events):", err.message);
    res.json([{ id: 1, name: "Database Error", error: err.message }]);
  }
});

// Create event
app.post("/api/events", async (req, res) => {
  try {
    const { name, department, dateTime, venue, price, totalTickets, availableTickets, lat, lng } = req.body;
    const [result] = await pool.query(
      "INSERT INTO events (name, department, dateTime, venue, price, totalTickets, availableTickets, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, department, dateTime, venue, price, totalTickets, availableTickets || totalTickets, lat, lng]
    );
    res.json({ id: (result as any).insertId, message: "Event created" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update event
app.put("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, dateTime, venue, price, totalTickets, availableTickets, lat, lng } = req.body;
    await pool.query(
      "UPDATE events SET name=?, department=?, dateTime=?, venue=?, price=?, totalTickets=?, availableTickets=?, lat=?, lng=? WHERE id=?",
      [name, department, dateTime, venue, price, totalTickets, availableTickets, lat, lng, id]
    );
    res.json({ message: "Event updated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete event
app.delete("/api/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM events WHERE id=?", [id]);
    res.json({ message: "Event deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get user bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });
    const [rows] = await pool.query("SELECT * FROM bookings WHERE userEmail = ? ORDER BY bookingDate DESC", [email]);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create booking (SQL version)
app.post("/api/bookings", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { eventId, eventName, userName, userEmail, userDepartment, ticketsCount, totalAmount } = req.body;

    // Check availability
    const [eventRow]: any[] = await connection.query("SELECT availableTickets FROM events WHERE id = ?", [eventId]);
    if (eventRow.length === 0 || eventRow[0].availableTickets < ticketsCount) {
      throw new Error("Tickets no longer available");
    }

    // Insert booking
    const [result] = await connection.query(
      "INSERT INTO bookings (eventId, eventName, userName, userEmail, userDepartment, ticketsCount, totalAmount, paymentStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [eventId, eventName, userName, userEmail, userDepartment, ticketsCount, totalAmount, 'pending']
    );

    await connection.commit();
    res.json({ id: (result as any).insertId });
  } catch (err: any) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Admin API: Get all bookings
app.get("/api/admin/bookings", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM bookings ORDER BY bookingDate DESC");
        res.json(rows);
    } catch (err: any) {
        console.error("MySQL DB Error (AdminBookings):", err.message);
        res.json([]);
    }
});

// Update booking status (e.g., after payment or void)
app.patch("/api/bookings/:id", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { paymentStatus } = req.body;

    // Get old status and ticket count
    const [oldBooking]: any[] = await connection.query("SELECT paymentStatus, ticketsCount, eventId FROM bookings WHERE id = ?", [id]);
    if (oldBooking.length === 0) throw new Error("Booking not found");

    await connection.query("UPDATE bookings SET paymentStatus = ? WHERE id = ?", [paymentStatus, id]);

    // Handle ticket pool if cancelling
    if (paymentStatus === 'cancelled' && oldBooking[0].paymentStatus !== 'cancelled') {
        await connection.query("UPDATE events SET availableTickets = availableTickets + ? WHERE id = ?", [oldBooking[0].ticketsCount, oldBooking[0].eventId]);
    } else if (paymentStatus === 'paid' && oldBooking[0].paymentStatus === 'pending') {
        await connection.query("UPDATE events SET availableTickets = availableTickets - ? WHERE id = ?", [oldBooking[0].ticketsCount, oldBooking[0].eventId]);
    }

    await connection.commit();
    res.json({ message: "Booking updated" });
  } catch (err: any) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Admin check using SQL table
app.get("/api/admin-check", async (req, res) => {
  try {
    const { uid } = req.query;
    const [rows]: any[] = await pool.query("SELECT * FROM admins WHERE uid = ?", [uid]);
    res.json({ isAdmin: rows.length > 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Existing Stripe Endpoints ---

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
    const origin = req.headers.origin || "http://localhost:3000";

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
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}&success=true`,
      cancel_url: `${origin}/?booking_id=${bookingId}&cancel=true`,
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

