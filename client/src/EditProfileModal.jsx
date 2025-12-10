import { useState } from "react";
import "./CreateTeamModal.css"; // We reuse the same premium modal styles!
import toast from "react-hot-toast";

const EditProfileModal = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    skills: user.skills ? user.skills.join(", ") : "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Process skills from string to array
    const updatedSkills = formData.skills
      .split(",")
      .map((s) => s.trim().toLowerCase()) // Normalize to lowercase for better matching
      .filter((s) => s);

    const updatedUser = {
      ...user,
      name: formData.name,
      skills: updatedSkills,
    };

    onUpdate(updatedUser);

    toast.success("Profile Vector Updated", {
      icon: "🧬",
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
          <h2>Edit Identity</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>DISPLAY NAME</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>SKILL VECTOR (Comma Separated)</label>
            <input
              type="text"
              placeholder="e.g. React, Node, Python"
              value={formData.skills}
              onChange={(e) =>
                setFormData({ ...formData, skills: e.target.value })
              }
            />
            <p style={{ fontSize: "0.7rem", color: "#666", marginTop: "5px" }}>
              * Adding skills here instantly recalibrates your AI matchmaking
              score.
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              CANCEL
            </button>
            <button type="submit" className="btn-create">
              UPDATE PROFILE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
