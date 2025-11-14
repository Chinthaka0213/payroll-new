import React, { useState, useEffect } from "react";
import axios from "axios";
import EmployeeHeader from "./EmployeeHeader";
import PersonalSection from "./PersonalSection";
import JobSection from "./JobSection";
import SalarySection from "./SalarySection";
import ProfilePhoto from "./ProfilePhoto";
import ActionButtons from "./ActionButtons";
import "./styles.css";

const API = "http://localhost:3005";

const EmployeeManagement = () => {
  const [selectedSection, setSelectedSection] = useState("personal");
  const [employeeData, setEmployeeData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API}/employees`);
      setEmployees(res.data);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  const handleSave = async () => {
    try {
      if (!employeeData.name || !employeeData.epfNo) {
        alert("Please enter EPF No and Name.");
        return;
      }

      const fd = new FormData();
      Object.entries(employeeData).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, v);
      });

      if (editingId) {
        await axios.put(`${API}/employees/${editingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Employee updated");
      } else {
        await axios.post(`${API}/employees`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Employee added");
      }

      setEmployeeData({});
      setEditingId(null);
      fetchEmployees();
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving employee");
    }
  };

  const handleEdit = (emp) => {
    setEmployeeData(emp);
    setEditingId(emp.id);
    setSelectedSection("personal");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    await axios.delete(`${API}/employees/${id}`);
    fetchEmployees();
  };

  const filtered = employees.filter((e) => {
    const s = search.toLowerCase();
    return (
      !s ||
      (e.name || "").toLowerCase().includes(s) ||
      (e.epfNo || "").toLowerCase().includes(s) ||
      (e.nic || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="container" style={{paddingTop:20}}>
      <h1 className="title">Proxima Payroll — Employee Management</h1>

      <div className="card">
        <EmployeeHeader employeeData={employeeData} setEmployeeData={setEmployeeData} />
        <ProfilePhoto employeeData={employeeData} setEmployeeData={setEmployeeData} />

        <div className="section-nav">
          <button onClick={() => setSelectedSection("personal")} className={selectedSection==="personal"?"active":""}>Personal</button>
          <button onClick={() => setSelectedSection("job")} className={selectedSection==="job"?"active":""}>Job</button>
          <button onClick={() => setSelectedSection("salary")} className={selectedSection==="salary"?"active":""}>Salary</button>
        </div>

        <div className="section-content">
          {selectedSection === "personal" && <PersonalSection employeeData={employeeData} setEmployeeData={setEmployeeData} />}
          {selectedSection === "job" && <JobSection employeeData={employeeData} setEmployeeData={setEmployeeData} />}
          {selectedSection === "salary" && <SalarySection employeeData={employeeData} setEmployeeData={setEmployeeData} />}
        </div>

        <ActionButtons
          onNew={() => { setEmployeeData({}); setEditingId(null); }}
          onSave={handleSave}
        />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <h3>Saved Employees</h3>
          <input placeholder="Search EPF/Name/NIC" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>EPF</th><th>Name</th><th>NIC</th><th>Dept</th><th>Photo</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id}>
                <td>{emp.epfNo}</td>
                <td>{emp.name}</td>
                <td>{emp.nic}</td>
                <td>{emp.department}</td>
                <td>
                  {emp.profile_photo ? (
                    <img src={`http://localhost:3005${emp.profile_photo}`} alt="profile" style={{ width:40, height:40, objectFit:"cover", borderRadius:4 }} />
                  ) : "-"}
                </td>
                <td>
                  <button className="btn" onClick={()=>handleEdit(emp)}>Edit</button>
                  <button className="btn danger" onClick={()=>handleDelete(emp.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={6} style={{textAlign:"center"}}>No employees</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManagement;