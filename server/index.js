const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

// DATABASE CONFIG (Replace with your actual keys)
const connectionString =
  "postgresql://neondb_owner:npg_kXDGEd59avFH@ep-lucky-cell-a1cj79gi-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false, 
  },
});

// 1. LOGIN (Simple check)
app.post("/login", async (req, res) => {
  const { email, password, name, skills } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length > 0) {
      res.json(userResult.rows[0]);
    } else {
      if (!name)
        return res.status(400).json({ message: "New user requires name" });

      const newUser = await pool.query(
        "INSERT INTO users (name, email, password, skills, is_premium) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, email, password, skills || [], false]
      );
      res.json(newUser.rows[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// 2. GET ALL TEAMS 
app.get("/teams", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM teams ORDER BY id DESC"); 
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.post("/teams", async (req, res) => {
  const { name, description, required_skills, host_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO teams (name, description, required_skills, host_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, description, required_skills, host_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create team" });
  }
});

app.post("/request-join", async (req, res) => {
  const { userId, teamId } = req.body;
  try {
    await pool.query(
      "INSERT INTO requests (user_id, team_id) VALUES ($1, $2)",
      [userId, teamId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/my-requests/:userId", async (req, res) => {
  const { userId } = req.params;
  const result = await pool.query(
    "SELECT team_id FROM requests WHERE user_id = $1",
    [userId]
  );
  res.json(result.rows.map((r) => r.team_id));
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
  const { userId, teams, userSkills } = req.body;

  const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [
    userId,
  ]);
  const user = userRes.rows[0];

  if (!user) return res.status(404).json({ message: "User not found" });
  if (!user.is_premium) {
    return res.status(403).json({ message: "Premium required" });
  }

  const skillsToAnalyze = userSkills || user.skills;

  // D. Call Python Service
  try {
    const aiResponse = await axios.post("http://localhost:8000/recommend", {
      user_skills: skillsToAnalyze,
      teams: teams,
    });
    res.json(aiResponse.data);
  } catch (error) {
    console.error("AI Service Error:", error.message);
    res.status(500).json({ message: "AI Engine Offline" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));