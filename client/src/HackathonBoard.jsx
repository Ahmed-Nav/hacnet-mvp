// src/HackathonBoard.jsx
import "./HackathonBoard.css";

const HackathonBoard = ({ onSelectHackathon }) => {
  const hackathons = [
    {
      id: 1,
      name: "Smart India Hackathon 2025",
      date: "Nov 15 - Nov 17",
      prizepool: "₹1,00,000",
      tags: ["GovTech", "AI", "Hardware"],
      status: "LIVE",
      color: "#FF9933", // Saffron-ish
    },
    {
      id: 2,
      name: "ETHIndia 2025",
      date: "Dec 2 - Dec 4",
      prizepool: "$10,000",
      tags: ["Blockchain", "Web3", "DeFi"],
      status: "UPCOMING",
      color: "#627EEA", // Ethereum Blue
    },
    {
      id: 3,
      name: "HackMIT",
      date: "Jan 20 - Jan 22",
      prizepool: "$15,000",
      tags: ["Open Innovation", "Cloud"],
      status: "REGISTRATION OPEN",
      color: "#D4AF37", // Gold
    },
  ];

  return (
    <div className="hackathon-container">
      <div className="board-header">
        <h2>Upcoming Events</h2>
        <p>Select an arena to find your squad.</p>
      </div>

      <div className="hackathon-grid">
        {hackathons.map((hack) => (
          <div
            key={hack.id}
            className="hack-card"
            onClick={() => onSelectHackathon(hack)}
          >
            <div className="card-top">
              <span
                className={`status-badge ${
                  hack.status === "LIVE" ? "live" : ""
                }`}
              >
                {hack.status === "LIVE" && <span className="blink-dot"></span>}
                {hack.status}
              </span>
              <span className="date-badge">{hack.date}</span>
            </div>

            <h3 style={{ borderLeft: `3px solid ${hack.color}` }}>
              {hack.name}
            </h3>

            <div className="prize-section">
              <span className="label">PRIZE POOL</span>
              <span className="amount">{hack.prizepool}</span>
            </div>

            <div className="tags-row">
              {hack.tags.map((tag, i) => (
                <span key={i} className="mini-tag">
                  {tag}
                </span>
              ))}
            </div>

            <button className="btn-enter">FIND TEAMS →</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HackathonBoard;
