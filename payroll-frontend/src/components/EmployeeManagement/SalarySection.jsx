import React from "react";

const SalarySection = ({ employeeData = {}, setEmployeeData }) => {
  const onChange = (n,v) => setEmployeeData(prev=>({...prev, [n]:v}));

  return (
    <div className="section-grid">
      <div>
        <label>Basic Salary</label>
        <input type="number" value={employeeData.basicSalary || ""} onChange={e=>onChange("basicSalary", e.target.value)} />
      </div>

      <div>
        <label>Allowance</label>
        <input type="number" value={employeeData.allowance || ""} onChange={e=>onChange("allowance", e.target.value)} />
      </div>

      <div>
        <label>PRA</label>
        <input type="number" value={employeeData.pra || ""} onChange={e=>onChange("pra", e.target.value)} />
      </div>

      <div>
        <label>Incentive</label>
        <input type="number" value={employeeData.incentive || ""} onChange={e=>onChange("incentive", e.target.value)} />
      </div>
    </div>
  );
};

export default SalarySection;