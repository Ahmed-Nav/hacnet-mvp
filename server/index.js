const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

// DATABASE CONFIG (Replace with your actual keys)
const connectionString =
  "postgresql://neondb_owner:npg_kXDGEd59avFH@ep-lucky-cell-a1cj79gi-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false, 
  },
});

// 1. LOGIN (Simple check)
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND password = $2",
    [email, password]
  );

  if (result.rows.length > 0) {
    res.json(result.rows[0]);
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// 2. GET ALL TEAMS (Normal View)
app.get("/teams", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM teams");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 3. FAKE PAYMENT (Upgrade User)
app.post("/upgrade", async (req, res) => {
  const { userId } = req.body;
  await pool.query("UPDATE users SET is_premium = TRUE WHERE id = $1", [
    userId,
  ]);
  res.json({ message: "Upgraded to Premium" });
});

// 4. AI MATCHMAKING (The Bridge)
app.post("/ai-match", async (req, res) => {
  const { userId } = req.body;

  // A. Fetch User Data
  const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [
    userId,
  ]);
  const user = userRes.rows[0];

  // B. Check Premium Status
  if (!user.is_premium) {
    return res.status(403).json({ message: "Premium required" });
  }

  // C. Fetch All Teams
  const teamsRes = await pool.query("SELECT * FROM teams");

  // D. Call Python Service
  try {
    const aiResponse = await axios.post("http://localhost:8000/recommend", {
      user_skills: user.skills,
      teams: teamsRes.rows,
    });
    res.json(aiResponse.data.recommendations);
  } catch (error) {
    console.error("AI Service Error:", error.message);
    res.status(500).json({ message: "AI Engine Offline" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
