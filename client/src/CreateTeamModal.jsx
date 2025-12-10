import { useState } from "react";
import "./CreateTeamModal.css";
import toast from "react-hot-toast";

const CreateTeamModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    skills: "", // We will split this string into an array later
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    // Convert comma-separated string to array
    const skillArray = formData.skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    const newTeam = {
      id: Date.now(), // Generate a temp ID
      name: formData.name,
      description: formData.description,
      required_skills: skillArray.length > 0 ? skillArray : ["general"],
      score: 100, // It's your own team, so 100% match!
      isHost: true, // 💡 Flag to identify this is YOUR team
    };

    onCreate(newTeam);
    toast.success("Team Created Successfully!", {
      icon: "🚀",
      style: {
        background: "#1A2F25",
        color: "#D4AF37",
        border: "1px solid #D4AF37",
      },
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Initialize Squad</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>TEAM NAME</label>
            <input
              type="text"
              placeholder="e.g. NeuralNet FinTech"
              autoFocus
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>MISSION BRIEF</label>
            <textarea
              rows="3"
              placeholder="What are you building?"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>REQUIRED SKILLS (Comma Separated)</label>
            <input
              type="text"
              placeholder="e.g. React, Python, AWS"
              value={formData.skills}
              onChange={(e) =>
                setFormData({ ...formData, skills: e.target.value })
              }
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              CANCEL
            </button>
            <button type="submit" className="btn-create">
              LAUNCH TEAM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;
