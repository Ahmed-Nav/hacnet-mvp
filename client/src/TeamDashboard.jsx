// src/TeamDashboard.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import "./TeamDashboard.css"; // We will create this next

const TeamDashboard = ({ team, user, onBack }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "System",
      text: `Welcome to the ${team.name} HQ.`,
      type: "system",
    },
    {
      id: 2,
      sender: "Host",
      text: "Hey! Glad you could make it. We were looking for a React expert.",
      type: "incoming",
    },
  ]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    const chatBox = document.getElementById("chat-feed");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // 1. Add User Message
    const newMessage = {
      id: Date.now(),
      sender: user.name,
      text: message,
      type: "outgoing",
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    // 2. Simulate Teammate Reply (The "Magic")
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        sender: "Dev_Sarah",
        text: "That sounds like a great plan. Let's start the repo.",
        type: "incoming",
      };
      setMessages((prev) => [...prev, reply]);
      toast.success("New message from Dev_Sarah", {
        icon: "💬",
        style: { background: "#1A2F25", color: "#F1F0E8" },
      });
    }, 2000);
  };

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <button onClick={onBack} className="back-btn">
            ← BACK
          </button>
          <h3>{team.name}</h3>
        </div>

        <div className="channel-group">
          <span className="group-label">TEXT CHANNELS</span>
          <div className="channel active"># general</div>
          <div className="channel"># ideas</div>
          <div className="channel"># resources</div>
        </div>

        <div className="channel-group">
          <span className="group-label">TEAM MEMBERS</span>
          <div className="member">
            <span className="status-dot online"></span> {user.name} (You)
          </div>
          <div className="member">
            <span className="status-dot busy"></span> Host_Alex
          </div>
          <div className="member">
            <span className="status-dot online"></span> Dev_Sarah
          </div>
        </div>
      </aside>

      {/* CHAT AREA */}
      <main className="chat-area">
        <header className="chat-header">
          <h2># general</h2>
          <p>Topic: {team.description}</p>
        </header>

        <div className="chat-feed" id="chat-feed">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.type}`}>
              {msg.type !== "outgoing" && msg.type !== "system" && (
                <div className="avatar">
                  {msg.sender ? msg.sender.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <div className="message-content">
                {msg.type !== "outgoing" && msg.type !== "system" && (
                  <span className="sender-name">{msg.sender}</span>
                )}
                <div className="bubble">{msg.text}</div>
              </div>
            </div>
          ))}
        </div>

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder={`Message #${team.name}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit" className="btn-send">
            SEND
          </button>
        </form>
      </main>
    </div>
  );
};

export default TeamDashboard;
