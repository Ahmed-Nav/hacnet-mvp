import { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast"; // 💡 IMPORT TOAST
import confetti from "canvas-confetti"; // 💡 IMPORT CONFETTI
import "./App.css";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  // 💡 NEW: Track which teams the user has requested to join
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await axios.get("http://localhost:5000/teams");
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async () => {
    // Simulate Login
    const res = await axios.post("http://localhost:5000/login", {
      email: "demo@test.com",
      password: "123",
    });
    const loggedInUser = {
      ...res.data,
      skills: ["react", "python", "node", "aws"],
    };
    setUser(loggedInUser);
    localStorage.setItem("user", JSON.stringify(loggedInUser));

    // 💡 NEW: Welcome Toast
    toast.success(`Welcome back, ${loggedInUser.name}`, {
      style: {
        background: "#1A2F25",
        color: "#D4AF37",
        border: "1px solid #D4AF37",
      },
    });
  };

  const handleUpgrade = async () => {
    setLoading(true);
    const loadingToast = toast.loading("Processing transaction...", {
      style: { background: "#1A2F25", color: "#F1F0E8" },
    });

    setTimeout(async () => {
      await axios.post("http://localhost:5000/upgrade", { userId: user.id });
      const updatedUser = { ...user, is_premium: true };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setLoading(false);

      // 💡 NEW: Dismiss loading, show success
      toast.dismiss(loadingToast);
      toast.success("Welcome to the Elite Tier.", {
        icon: "🥂",
        style: {
          background: "#1A2F25",
          color: "#D4AF37",
          border: "1px solid #D4AF37",
        },
      });
      triggerConfetti();
    }, 1500);
  };

  const getAIMatches = async () => {
    setLoading(true); // Start spinner
    try {
      const res = await axios.post("http://localhost:5000/ai-match", {
        userId: user.id,
      });
      setTeams(res.data);
      setLoading(false);

      // 💡 NEW: Success Toast & Confetti
      toast.success(`AI Analysis Complete: ${res.data.length} Matches Found`, {
        style: { background: "#1A2F25", color: "#F1F0E8" },
      });
      triggerConfetti();
    } catch (error) {
      setLoading(false);
      if (error.response && error.response.status === 403)
        toast.error("Premium Membership Required", {
          style: { background: "#330000", color: "#fff" },
        });
      else
        toast.error("AI Engine is warming up...", {
          style: { background: "#330000", color: "#fff" },
        });
    }
  };

  const handleFilter = (skill) => {
    const newFilter = activeFilter === skill ? null : skill;
    setActiveFilter(newFilter);
    if (newFilter) {
      setTeams(
        teams.filter((team) =>
          team.required_skills.some((s) => s.toLowerCase() === newFilter)
        )
      );
      toast(`Filtered by: ${skill}`, {
        icon: "🔍",
        style: { background: "#1A2F25", color: "#F1F0E8" },
      });
    } else {
      fetchTeams();
    }
  };

  const handleReset = () => {
    setActiveFilter(null);
    fetchTeams();
    toast("View Reset", {
      icon: "↺",
      style: { background: "#1A2F25", color: "#F1F0E8" },
    });
  };

  // 💡 NEW: Handle "Request to Join"
  const handleJoinRequest = (teamId) => {
    toast.success("Request Sent to Team Host", {
      icon: "📩",
      style: { background: "#1A2F25", color: "#D4AF37" },
    });
    setRequests([...requests, teamId]); // Add to local state to disable button
  };

  // 💡 NEW: Confetti Function
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#F1F0E8", "#0F1C15"], // Gold, Cream, Green
    });
  };

  if (!user)
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          background: "#0F1C15",
          color: "#F1F0E8",
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            marginBottom: "20px",
            fontFamily: "Playfair Display",
          }}
        >
          HackNet.
        </h1>
        <button className="btn btn-primary" onClick={handleLogin}>
          Enter Platform
        </button>
        <Toaster position="bottom-center" />
      </div>
    );

  return (
    <div className="container">
      {/* 💡 NEW: Toaster Component needs to be rendered once */}
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />

      <div className="brand">
        <h1>HackNet.</h1>
        <span>Premium Team Orchestration</span>
      </div>

      <div className="main-grid">
        <div className="content-area">
          <div className="action-bar">
            <div className="teams-header">
              <h2>Active Teams</h2>
              <p>{teams.length} teams available</p>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              {(activeFilter || teams.length < 3) && (
                <button className="btn btn-reset" onClick={handleReset}>
                  ↺ Reset View
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={getAIMatches}
                disabled={loading}
                style={{
                  minWidth: "160px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> Analyzing...
                  </>
                ) : user.is_premium ? (
                  "⚡ Run AI Match"
                ) : (
                  "🔒 AI Match"
                )}
              </button>
            </div>
          </div>

          <div className="team-grid">
            {teams.map((team) => (
              <div key={team.id} className="team-card">
                {team.score && (
                  <div
                    style={{
                      position: "absolute",
                      top: "20px",
                      right: "20px",
                      background: "#D4AF37",
                      color: "#0F1C15",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      padding: "6px 10px",
                      borderRadius: "4px",
                      zIndex: 10,
                    }}
                  >
                    {team.score * 10}% MATCH
                  </div>
                )}

                <div>
                  <h3>{team.name}</h3>
                  <p>{team.description}</p>
                </div>

                <div className="skills-container">
                  <span className="skills-label">Required Stack</span>
                  <div className="skills-list">
                    {team.required_skills &&
                      team.required_skills.map((skill, index) => {
                        const isMatch =
                          user.skills &&
                          user.skills.includes(skill.toLowerCase());
                        return (
                          <span
                            key={index}
                            className={`skill-tag ${
                              isMatch ? "matched-skill" : ""
                            }`}
                          >
                            {skill} {isMatch && "✓"}
                          </span>
                        );
                      })}
                  </div>
                </div>

                {/* 💡 NEW: Request to Join Button */}
                <button
                  className="btn-join"
                  onClick={() => handleJoinRequest(team.id)}
                  disabled={requests.includes(team.id)}
                >
                  {requests.includes(team.id)
                    ? "Request Pending"
                    : "Request to Join →"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <aside className="user-card">
          <h3 style={{ marginBottom: "5px" }}>{user.name}</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            {user.email}
          </p>

          <div style={{ marginTop: "20px" }}>
            <span className="skills-label">
              YOUR EXPERTISE (Click to filter)
            </span>
            <div className="skills-list">
              {user.skills &&
                user.skills.map((skill, i) => (
                  <span
                    key={i}
                    className={`skill-tag ${
                      activeFilter === skill ? "active-filter" : "user-skill"
                    }`}
                    onClick={() => handleFilter(skill)}
                  >
                    {skill}
                  </span>
                ))}
            </div>
          </div>

          <hr
            style={{
              border: "0",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              margin: "20px 0",
            }}
          />

          {user.is_premium ? (
            <span className="premium-badge">✦ Premium Architect</span>
          ) : (
            <>
              <button
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? "Processing..." : "Unlock Premium (₹99)"}
              </button>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  marginTop: "15px",
                  textAlign: "center",
                  lineHeight: "1.4",
                }}
              >
                Unlock AI matching to find your perfect team instantly.
              </p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;
