import { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast"; 
import confetti from "canvas-confetti"; 
import "./App.css";
import TeamDashboard from "./TeamDashboard";
import HackathonBoard from "./HackathonBoard";
import CreateTeamModal from "./CreateTeamModal";
import EditProfileModal from "./EditProfileModal";

function App() {
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({
    name: "",
    email: "",
    password: "",
    skills: "",
  });
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  
  const [allTeams, setAllTeams] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [view, setView] = useState("hackathons");
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (user && user.id) {
      axios
        .get(`https://hacnet-mvp.onrender.com/my-requests/${user.id}`)
        .then((res) => setRequests(res.data))
        .catch((err) => console.error(err));
    }
  }, [user]);

  useEffect(() => {
    fetchTeams();
  }, [user]);

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state) {
        setView(event.state.view || "hackathons");
        setCurrentTeam(event.state.currentTeam || null);
        if (event.state.view === "teams") {
          // Optional: Persist selected hackathon in history too if needed
        }
      } else {
        setView("hackathons");
        setCurrentTeam(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await axios.get("https://hacnet-mvp.onrender.com/teams");
      let dbTeams = res.data;

      const processedTeams = dbTeams.map((team) => ({
        ...team,
        isHost: user ? team.host_id === user.id : false,
      }));

      setTeams(processedTeams);
    } catch (err) {
      console.error(err);
    }
  };
  const handleAuth = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        email: authData.email,
        password: authData.password,
        ...(authMode === "signup" && {
          name: authData.name,
          skills: authData.skills.split(",").map((s) => s.trim()),
        }),
      };

      const res = await axios.post("https://hacnet-mvp.onrender.com/login", payload);

      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data)); // Keep session
      toast.success(`Welcome, ${res.data.name}`);
    } catch (err) {
      toast.error("Login Failed");
      console.log(err);
    }
  };
  const handleUpgrade = async () => {
    setLoading(true);
    const loadingToast = toast.loading("Processing transaction...", {
      style: { background: "#1A2F25", color: "#F1F0E8" },
    });

    setTimeout(async () => {
      await axios.post("https://hacnet-mvp.onrender.com/upgrade", { userId: user.id });
      const updatedUser = { ...user, is_premium: true };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setLoading(false);

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

  const handleLogout = () => {
    localStorage.removeItem("user"); // Clear session
    setUser(null); // Reset state
    setView("hackathons"); // Reset view to default
    setCurrentTeam(null);
    toast.success("Logged out successfully", {
      style: {
        background: "#1A2F25",
        color: "#D4AF37",
        border: "1px solid #D4AF37",
      },
    });
  };

  const getAIMatches = async () => {
    setLoading(true); 
    try {
      const res = await axios.post("https://hacnet-mvp.onrender.com/ai-match", {
        userId: user.id,
        teams: allTeams,
        userSkills: user.skills,
      });
      if (res.data && Array.isArray(res.data)) {
        setTeams(res.data); 
      } else if (res.data && res.data.recommendations) {
        setTeams(res.data.recommendations); 
      } else {
        console.error("Invalid AI response structure:", res.data);
        toast.error("AI returned unexpected data");
      }
      setLoading(false);

      toast.success(`AI Analysis Complete: ${res.data.length} Matches Found`, {
        style: { background: "#1A2F25", color: "#F1F0E8" },
      });
      triggerConfetti();
    } catch (error) {
      setLoading(false);
      console.error("AI Error:", error);
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
      const filtered = allTeams.filter((team) =>
        team.required_skills.some((s) => s.toLowerCase() === newFilter)
      );
      setTeams(filtered);
      toast(`Filtered by: ${skill}`, {
        icon: "🔍",
        style: { background: "#1A2F25", color: "#F1F0E8" },
      });
    } else {
      setTeams(allTeams);
    }
  };

  const handleReset = () => {
    setActiveFilter(null);
    setTeams(allTeams);
    toast("View Reset", {
      icon: "↺",
      style: { background: "#1A2F25", color: "#F1F0E8" },
    });
  };

  const handleJoinRequest = async (teamId) => {
    try {
      await axios.post("https://hacnet-mvp.onrender.com/request-join", {
        userId: user.id,
        teamId: teamId,
      });
      setRequests([...requests, teamId]); 
      toast.success("Request Sent");
    } catch (err) {
      toast.error("Request Failed");
      console.log(err);
    }
  };

  const handleHackathonSelect = (hackathon) => {
    setSelectedHackathon(hackathon);
    setView("teams");
    window.history.pushState({ view: "teams", currentTeam: null }, "");
    toast.success(`Entering ${hackathon.name}`, {
      icon: "🚀",
      style: { background: "#1A2F25", color: "#F1F0E8" },
    });
  };

  const handleCreateTeam = async (newTeamData) => {
    try {
      const payload = {
        name: newTeamData.name,
        description: newTeamData.description,
        required_skills: newTeamData.required_skills,
        host_id: user.id,
      };

      // 1. Save to DB
      await axios.post("https://hacnet-mvp.onrender.com/teams", payload);

      // 2. Re-fetch from DB (This ensures we get the real ID and isHost is calculated)
      await fetchTeams();

      toast.success("Team Launched!");
    } catch (err) {
      toast.error("Failed to create team");
      console.log(err);
    }
  };

  const handleUpdateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setTeams(allTeams);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#F1F0E8", "#0F1C15"], // Gold, Cream, Green
    });
  };

  return (
    <div className="container">
      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />

      {/* 1. LOGIN SCREEN */}
      {!user && (
        <div
          style={{
            height: "580px",
            width: "100vw",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            background: "#0F1C15",
            color: "#F1F0E8",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,
          }}
        >
          <h1
            style={{
              fontSize: "3rem",
              marginBottom: "10px",
              fontFamily: "Playfair Display",
            }}
          >
            HacNet
          </h1>
          <p
            style={{
              color: "#B0C4B1",
              marginBottom: "40px",
              letterSpacing: "2px",
              fontSize: "0.9rem",
            }}
          >
            PREMIUM TEAM ORCHESTRATION
          </p>

          <div
            style={{
              background: "#1A2F25",
              padding: "40px",
              borderRadius: "12px",
              border: "1px solid #D4AF37",
              width: "400px",
              maxWidth: "90%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#D4AF37",
                textAlign: "center",
                fontFamily: "Playfair Display",
              }}
            >
              {authMode === "login" ? "Member Login" : "New Architect"}
            </h2>

            <form
              onSubmit={handleAuth}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                marginTop: "30px",
              }}
            >
              {/* Name (Signup Only) */}
              {authMode === "signup" && (
                <div>
                  <label className="auth-label">FULL NAME</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. John Doe"
                    value={authData.name}
                    onChange={(e) =>
                      setAuthData({ ...authData, name: e.target.value })
                    }
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="auth-label">EMAIL ACCESS KEY</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={authData.email}
                  onChange={(e) =>
                    setAuthData({ ...authData, email: e.target.value })
                  }
                />
              </div>

              {/* Password */}
              <div>
                <label className="auth-label">PASSWORD</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={authData.password}
                  onChange={(e) =>
                    setAuthData({ ...authData, password: e.target.value })
                  }
                />
              </div>

              {/* Skills (Signup Only) */}
              {authMode === "signup" && (
                <div>
                  <label className="auth-label">
                    SKILL VECTOR (Comma Separated)
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="React, Python, AWS..."
                    value={authData.skills}
                    onChange={(e) =>
                      setAuthData({ ...authData, skills: e.target.value })
                    }
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: "10px"}}
              >
                {authMode === "login" ? "ENTER PLATFORM" : "INITIALIZE PROFILE"}
              </button>
            </form>

            {/* Toggle Switch */}
            <div
              style={{
                marginTop: "25px",
                textAlign: "center",
                fontSize: "0.85rem",
                color: "#888",
              }}
            >
              {authMode === "login" ? "New to HacNet? " : "Already verified? "}
              <span
                onClick={() =>
                  setAuthMode(authMode === "login" ? "signup" : "login")
                }
                style={{
                  color: "#D4AF37",
                  cursor: "pointer",
                  fontWeight: "bold",
                  textDecoration: "underline",
                }}
              >
                {authMode === "login" ? "Apply for Access" : "Login Here"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. TEAM DASHBOARD (CHAT) */}
      {user && currentTeam && (
        <TeamDashboard
          team={currentTeam}
          user={user}
          onBack={() => setCurrentTeam(null)}
        />
      )}

      {/* 3. MAIN APP (Hackathons or Teams) */}
      {user && !currentTeam && (
        <>
          {/* Top Header */}
          <div
            className="brand"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              flexDirection: "column",
              width: "100%",
              paddingBottom: "20px",
            }}
          >
            {view === "teams" && (
              <button
                className="btn-reset"
                onClick={() => {
                  setView("hackathons");
                  fetchTeams();
                }}
                style={{
                  marginBottom: "10px",
                  padding: "5px 0",
                  border: "none",
                }}
              >
                ← Back to Events
              </button>
            )}
            <div>
              <h1>{selectedHackathon?.name || "HacNet"}</h1>
              <span>
                {view === "hackathons" ? "Premium Event Board" : "Team Finder"}
              </span>
            </div>
          </div>

          {/* VIEW A: HACKATHONS LIST */}
          {view === "hackathons" && (
            <>
              {/* User Card as a Top Header for Hackathon View */}
              <aside
                className="user-card"
                style={{ marginBottom: "30px", position: "relative", top: 0 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3 style={{ marginBottom: "5px" }}>{user.name}</h3>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {user.email}
                    </p>
                  </div>
                  <div></div>
                  {user.is_premium ? (
                    <span className="premium-badge">✦ Premium Architect</span>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={handleUpgrade}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Unlock Premium (₹99)"}
                    </button>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    border: "1px solid #555",
                    color: "#aaa",
                    cursor: "pointer",
                    fontSize: "0.7rem",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    marginBottom: "15px", // Spacing before the badge
                    width: "100px",
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.target.style.borderColor = "#ff4444";
                    e.target.style.color = "#ff4444";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.borderColor = "#555";
                    e.target.style.color = "#aaa";
                  }}
                >
                  SIGN OUT
                </button>
              </aside>
              <HackathonBoard onSelectHackathon={handleHackathonSelect} />
            </>
          )}

          {/* VIEW B: TEAM FINDER (The Grid View) */}
          {view === "teams" && (
            <div className="main-grid">
              {/* LEFT COL: TEAMS LIST */}
              <div className="content-area">
                <div className="action-bar">
                  <div className="teams-header">
                    <h2>Active Teams</h2>
                    <p>
                      {teams.length} teams available for{" "}
                      {selectedHackathon?.name}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      className="btn-reset"
                      style={{ border: "1px solid #D4AF37", color: "#D4AF37" }}
                      onClick={() => setShowCreateModal(true)}
                    >
                      + Host Team
                    </button>
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
                    <div
                      key={team.id}
                      className="team-card"
                      style={
                        team.isHost
                          ? { borderColor: "#D4AF37", background: "#1a2f25" }
                          : {}
                      }
                    >
                      {team.isHost && (
                        <div
                          style={{
                            position: "absolute",
                            top: "20px",
                            right: "20px",
                            color: "#D4AF37",
                            fontWeight: "bold",
                            fontSize: "0.8rem",
                            letterSpacing: "1px",
                          }}
                        >
                          ★ YOUR TEAM
                        </div>
                      )}
                      {!team.isHost && team.score && (
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
                      {team.isHost ? (
                        <button
                          className="btn-join"
                          style={{
                            borderColor: "#D4AF37",
                            color: "#D4AF37",
                            cursor: "default",
                          }}
                        >
                          MANAGE SQUAD
                        </button>
                      ) : /* Existing Logic for other teams */
                      requests.includes(team.id) ? (
                        <button
                          className="btn-join"
                          style={{ borderColor: "#4CAF50", color: "#4CAF50" }}
                          onClick={() => {
                            setCurrentTeam(team);
                            window.history.pushState(
                              { view: "teams", currentTeam: team },
                              ""
                            );
                          }}
                        >
                          ✓ Enter Team HQ
                        </button>
                      ) : (
                        <button
                          className="btn-join"
                          onClick={() => handleJoinRequest(team.id)}
                        >
                          Request to Join →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT COL: SIDEBAR (Now properly inside the grid!) */}
              <aside className="user-card">
                <h3 style={{ marginBottom: "5px" }}>{user.name}</h3>
                <p
                  style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}
                >
                  {user.email}
                </p>

                {user.is_premium ? (
                  <span className="premium-badge">✦ Premium Architect</span>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: "15px", width: "100%" }}
                    onClick={handleUpgrade}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Unlock Premium (₹99)"}
                  </button>
                )}
                <hr
                  style={{
                    border: "0",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                    margin: "20px 0",
                  }}
                />
                <div style={{ marginTop: "20px" }}>
                  <span className="skills-label">
                    YOUR EXPERTISE (Click to filter)
                  </span>
                  <button
                    onClick={() => setShowProfileModal(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#D4AF37",
                      cursor: "pointer",
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      fontWeight: "bold",
                      letterSpacing: "1px",
                      opacity: 0.8,
                    }}
                  >
                    EDIT ✎
                  </button>
                  <div className="skills-list">
                    {user.skills &&
                      user.skills.map((skill, i) => (
                        <span
                          key={i}
                          className={`skill-tag ${
                            activeFilter === skill
                              ? "active-filter"
                              : "user-skill"
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
              </aside>
            </div>
          )}
          {showCreateModal && (
            <CreateTeamModal
              onClose={() => setShowCreateModal(false)}
              onCreate={handleCreateTeam}
            />
          )}

          {showProfileModal && (
            <EditProfileModal
              user={user}
              onClose={() => setShowProfileModal(false)}
              onUpdate={handleUpdateProfile}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
