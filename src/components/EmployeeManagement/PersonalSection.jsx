import React from "react";

const PersonalSection = ({ employeeData = {}, setEmployeeData }) => {
  const onChange = (name, val) => setEmployeeData(prev => ({ ...prev, [name]: val }));

  return (
    <div className="section-grid">
      <div>
        <label>Address</label>
        <input value={employeeData.address || ""} onChange={e=>onChange("address", e.target.value)} placeholder="Address" />
      </div>

      <div>
        <label>Date of Birth</label>
        <input type="date" value={employeeData.dob || ""} onChange={e=>onChange("dob", e.target.value)} />
      </div>

      <div>
        <label>Gender</label>
        <select value={employeeData.gender || ""} onChange={e=>onChange("gender", e.target.value)}>
          <option value="">Select</option>
          <option value="Male">Male</option><option value="Female">Female</option>
        </select>
      </div>
    </div>
  );
};

export default PersonalSection;