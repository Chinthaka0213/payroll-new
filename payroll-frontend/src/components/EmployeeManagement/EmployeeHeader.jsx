import React from "react";

const EmployeeHeader = ({ employeeData = {}, setEmployeeData }) => {
  const onChange = (name, value) => setEmployeeData(prev => ({ ...prev, [name]: value }));

  return (
    <div className="header-grid">
      <div>
        <label>EPF No</label>
        <input value={employeeData.epfNo || ""} onChange={e=>onChange("epfNo", e.target.value)} placeholder="EPF No" />
      </div>

      <div>
        <label>Name</label>
        <input value={employeeData.name || ""} onChange={e=>onChange("name", e.target.value)} placeholder="Full name" />
      </div>

      <div>
        <label>NIC</label>
        <input value={employeeData.nic || ""} onChange={e=>onChange("nic", e.target.value)} placeholder="NIC" />
      </div>

      <div>
        <label>Phone</label>
        <input value={employeeData.phone || ""} onChange={e=>onChange("phone", e.target.value)} placeholder="Phone" />
      </div>
    </div>
  );
};

export default EmployeeHeader;