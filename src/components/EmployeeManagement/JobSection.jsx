import React from "react";

const JobSection = ({ employeeData = {}, setEmployeeData }) => {
  const onChange = (n,v) => setEmployeeData(prev=>({...prev, [n]:v}));

  return (
    <div className="section-grid">
      <div>
        <label>Department</label>
        <input value={employeeData.department || ""} onChange={e=>onChange("department", e.target.value)} />
      </div>

      <div>
        <label>Position</label>
        <input value={employeeData.position || ""} onChange={e=>onChange("position", e.target.value)} />
      </div>

      <div>
        <label>Employee Type</label>
        <select value={employeeData.employee_type || ""} onChange={e=>onChange("employee_type", e.target.value)}>
          <option value="">Select</option>
          <option value="Permanent">Permanent</option>
          <option value="Contract">Contract</option>
          <option value="Intern">Intern</option>
        </select>
      </div>

      <div>
        <label>EPF Active</label>
        <select value={employeeData.epf_active || ""} onChange={e=>onChange("epf_active", e.target.value)}>
          <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
        </select>
      </div>
    </div>
  );
};

export default JobSection;