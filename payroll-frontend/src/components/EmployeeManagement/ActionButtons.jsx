import React from "react";

const ActionButtons = ({ onNew, onSave }) => {
  return (
    <div style={{ display:"flex", gap:10, marginTop:12 }}>
      <button className="btn" onClick={onNew}>New</button>
      <button className="btn primary" onClick={onSave}>Save</button>
    </div>
  );
};

export default ActionButtons;