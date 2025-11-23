
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:3005";

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0,10);
  });
  const [status, setStatus] = useState("Present");
  const [otHours, setOtHours] = useState(0);
  const [note, setNote] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth()+1);
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employeeId) fetchSummary(employeeId, year, month);
    else {
      setSummary(null);
      setRows([]);
    }
  }, [employeeId, year, month]);

  async function fetchEmployees() {
    try {
      const res = await axios.get(`${API}/employees`);
      setEmployees(res.data || []);
    } catch (e) {
      console.error(e);
      setMessage("Failed to load employees");
    }
  }

  async function fetchSummary(empId, y, m) {
    try {
      const res = await axios.get(`${API}/api/attendance/summary/${empId}/${y}/${m}`);
      setSummary(res.data.summary || { present:0, absent:0, leave:0, ot_hours:0 });
      setRows(res.data.rows || []);
    } catch (e) {
      console.error(e);
      setMessage("Failed to load attendance summary");
    }
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!employeeId) { setMessage("Select employee"); return; }
    if (!date) { setMessage("Select date"); return; }

    try {
      const payload = {
        employee_id: Number(employeeId),
        date,
        status,
        ot_hours: Number(otHours) || 0,
        note
      };
      await axios.post(`${API}/api/attendance`, payload);
      setMessage("Attendance saved");
      // refresh list for this month
      fetchSummary(employeeId, year, month);
    } catch (err) {
      console.error(err);
      setMessage("Error saving attendance");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attendance record?")) return;
    try {
      await axios.delete(`${API}/api/attendance/${id}`);
      setMessage("Deleted");
      fetchSummary(employeeId, year, month);
    } catch (e) {
      console.error(e);
      setMessage("Error deleting record");
    }
  };

  // Quick fill: create attendance for a range of dates for selected employee
  const handleQuickFill = async () => {
    if (!employeeId) { setMessage("Select employee to quick-fill"); return; }
    const start = prompt("Enter start date (YYYY-MM-DD) for quick-fill", date);
    const end = prompt("Enter end date (YYYY-MM-DD) for quick-fill", date);
    const statusFill = prompt("Status to fill (Present / Absent / Leave)", "Present");
    if (!start || !end || !statusFill) return;

    const sd = new Date(start);
    const ed = new Date(end);
    if (sd > ed) { setMessage("Start must be before end"); return; }

    const days = [];
    for (let d = new Date(sd); d <= ed; d.setDate(d.getDate()+1)) {
      days.push(new Date(d).toISOString().slice(0,10));
    }
    try {
      for (const day of days) {
        await axios.post(`${API}/api/attendance`, {
          employee_id: Number(employeeId),
          date: day,
          status: statusFill,
          ot_hours: 0
        });
      }
      setMessage(`Quick-filled ${days.length} days`);
      fetchSummary(employeeId, year, month);
    } catch (e) {
      console.error(e);
      setMessage("Quick-fill error");
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto", padding: 16 }}>
      <h2>Attendance</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label>Employee</label>
        <select value={employeeId} onChange={e=>setEmployeeId(e.target.value)}>
          <option value="">-- select --</option>
          {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.epfNo || "-"})</option>)}
        </select>

        <label>Year</label>
        <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} style={{width:100}} />

        <label>Month</label>
        <input type="number" value={month} min={1} max={12} onChange={e=>setMonth(Number(e.target.value))} style={{width:70}} />
        <button onClick={()=>employeeId && fetchSummary(employeeId, year, month)}>Load</button>
      </div>

      <form onSubmit={handleSave} style={{ border: "1px solid #ddd", padding:12, borderRadius:6, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label>Date
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </label>

          <label>Status
            <select value={status} onChange={e=>setStatus(e.target.value)}>
              <option>Present</option>
              <option>Absent</option>
              <option>Leave</option>
            </select>
          </label>

          <label>OT Hours
            <input type="number" min="0" step="0.5" value={otHours} onChange={e=>setOtHours(e.target.value)} style={{width:80}} />
          </label>

          <label>Note
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="optional" />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit">Save Attendance</button>
            <button type="button" onClick={handleQuickFill}>Quick fill</button>
          </div>
        </div>
      </form>

      {message && <div style={{ marginBottom:12, color: "darkblue" }}>{message}</div>}

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h4>Monthly Summary</h4>
          {summary ? (
            <div>
              <p>Present: {summary.present} | Absent: {summary.absent} | Leave: {summary.leave} | OT hours: {summary.ot_hours}</p>
            </div>
          ) : <p>Select employee and load to see summary</p>}
        </div>

        <div style={{ flex: 2 }}>
          <h4>Records for {year}-{String(month).padStart(2,"0")}</h4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background:"#f0f0f0" }}>
                <th style={{ border: "1px solid #ddd", padding:6 }}>Date</th>
                <th style={{ border: "1px solid #ddd", padding:6 }}>Status</th>
                <th style={{ border: "1px solid #ddd", padding:6 }}>OT Hours</th>
                <th style={{ border: "1px solid #ddd", padding:6 }}>Note</th>
                <th style={{ border: "1px solid #ddd", padding:6 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} style={{ textAlign:"center", padding:12 }}>No records</td></tr>}
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={{ border: "1px solid #eee", padding:6 }}>{r.date}</td>
                  <td style={{ border: "1px solid #eee", padding:6 }}>{r.status}</td>
                  <td style={{ border: "1px solid #eee", padding:6 }}>{r.ot_hours}</td>
                  <td style={{ border: "1px solid #eee", padding:6 }}>{r.note || "-"}</td>
                  <td style={{ border: "1px solid #eee", padding:6 }}>
                    <button onClick={()=>handleDelete(r.id)} style={{ color:"red" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
