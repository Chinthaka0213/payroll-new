import React, { useState, useEffect } from "react";

const ProfilePhoto = ({ employeeData = {}, setEmployeeData }) => {
  const [preview, setPreview] = useState(null);

  // Show existing image if editing
  useEffect(() => {
    if (typeof employeeData.profile_photo === "string") {
      setPreview(`http://localhost:3005${employeeData.profile_photo}`);
    } else if (employeeData.profile_photo instanceof File) {
      setPreview(URL.createObjectURL(employeeData.profile_photo));
    } else {
      setPreview(null);
    }
  }, [employeeData.profile_photo]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEmployeeData(prev => ({
      ...prev,
      profile_photo: file
    }));

    setPreview(URL.createObjectURL(file)); // show new preview
  };

  return (
    <div style={{ display:"flex", gap:20, alignItems:"center", marginTop:12 }}>
      
      {/* File Input */}
      <div>
        <label>Profile Photo</label>
        <input type="file" accept="image/*" onChange={handleFile} />
      </div>

      {/* Preview */}
      <div>
        {preview ? (
          <img 
            src={preview}
            alt="preview"
            style={{
              width: 80,
              height: 80,
              objectFit: "cover",
              borderRadius: 6,
              border: "1px solid #ddd"
            }}
          />
        ) : (
          <div style={{ fontSize: 12, color: "#777" }}>
            No photo selected
          </div>
        )}
      </div>

    </div>
  );
};

export default ProfilePhoto;
