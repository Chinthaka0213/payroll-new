import React from "react";

const ProfilePhoto = ({ employeeData = {}, setEmployeeData }) => {
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) setEmployeeData(prev => ({ ...prev, profile_photo: f }));
  };

  return (
    <div style={{ display:"flex", gap:12, alignItems:"center", marginTop:12 }}>
      <div>
        <label>Profile Photo</label>
        <input type="file" accept="image/*" onChange={handleFile} />
      </div>

      <div>
        {employeeData.profile_photo && typeof employeeData.profile_photo !== "string" && (
          <div style={{ fontSize:12 }}>Selected: {employeeData.profile_photo.name}</div>
        )}
      </div>
    </div>
  );
};

export default ProfilePhoto;