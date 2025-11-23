import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:3005";

export default function SalaryProcessing() {
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [otHours, setOtHours] = useState(0);

  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchSettings();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API}/employees`);
      setEmployees(res.data || []);
    } catch (e) {
      console.error("fetchEmployees:", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/api/payroll/settings/latest`);
      setSettings(res.data || {});
    } catch (e) {
      console.error("fetchSettings:", e);
    }
  };

  const handleCalculate = async () => {
    if (!selectedEmp) {
      setMessage("Select an employee first");
      return;
    }
    setMessage("");
    try {
      const payload = {
        employeeId: selectedEmp,
        year,
        month,
        ot_hours: otHours
      };
      const res = await axios.post(`${API}/api/payroll/calculate`, payload);
      setResult(res.data);
    } catch (e) {
      console.error("calculate:", e);
      setMessage("Error calculating salary");
    }
  };

  const handleSave = async () => {
    if (!result) {
      setMessage("Please calculate first");
      return;
    }
    try {
      const savePayload = {
        employee_id: result.employee.id,
        year: result.year,
        month: result.month,
        basicSalary: result.basicSalary,
        allowance: result.allowance,
        pra: result.pra,
        incentive: result.incentive,
        ot_hours: result.ot_hours,
        ot_amount: result.ot_amount,
        epf_employee_amount: result.epf_employee_amount,
        epf_company_amount: result.epf_company_amount,
        etf_amount: result.etf_amount,
        gross_amount: result.gross_amount,
        deductions: result.deductions,
        net_amount: result.net_amount
      };

      const res = await axios.post(`${API}/api/payroll/save`, savePayload);
      setMessage("Payroll saved: ID " + res.data.id);
    } catch (e) {
      console.error("save:", e);
      setMessage("Error saving payroll record");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 20 }}>
      <h2>Salary Processing</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label style={{ minWidth: 90 }}>Employee</label>
        <select value={selectedEmp||""} onChange={(e)=>setSelectedEmp(Number(e.target.value)||null)}>
          <option value="">-- select employee --</option>
          {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.epfNo || "-"})</option>)}
        </select>

        <label style={{ marginLeft: 12 }}>Year</label>
        <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} style={{width:100}} />

        <label style={{ marginLeft: 12 }}>Month</label>
        <input type="number" value={month} onChange={e=>setMonth(Number(e.target.value))} style={{width:60}} />

        <label style={{ marginLeft: 12 }}>OT Hours</label>
        <input type="number" value={otHours} onChange={e=>setOtHours(Number(e.target.value))} style={{width:80}} />

        <button onClick={handleCalculate} style={{ marginLeft: 12 }}>Calculate Salary</button>
      </div>

      {message && <p style={{ color: "red" }}>{message}</p>}

      {result && (
        <div style={{ border: "1px solid #ccc", padding: 12, borderRadius: 6 }}>
          <h3>Payslip Preview</h3>
          <p><strong>{result.employee.name}</strong> — EPF: {result.employee.epfNo}</p>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr><td>Basic Salary</td><td style={{ textAlign: "right" }}>{result.basicSalary.toFixed(2)}</td></tr>
              <tr><td>Allowance</td><td style={{ textAlign: "right" }}>{result.allowance.toFixed(2)}</td></tr>
              <tr><td>PRA</td><td style={{ textAlign: "right" }}>{result.pra.toFixed(2)}</td></tr>
              <tr><td>Incentive</td><td style={{ textAlign: "right" }}>{result.incentive.toFixed(2)}</td></tr>
              <tr><td>OT ({result.ot_hours} hrs)</td><td style={{ textAlign: "right" }}>{result.ot_amount.toFixed(2)}</td></tr>

              <tr style={{ borderTop: "1px solid #ccc" }}>
                <td><strong>Gross</strong></td>
                <td style={{ textAlign: "right" }}><strong>{result.gross_amount.toFixed(2)}</strong></td>
              </tr>

              <tr><td>EPF (Employee)</td><td style={{ textAlign: "right" }}>{result.epf_employee_amount.toFixed(2)}</td></tr>
              <tr><td>EPF (Company)</td><td style={{ textAlign: "right" }}>{result.epf_company_amount.toFixed(2)}</td></tr>
              <tr><td>ETF</td><td style={{ textAlign: "right" }}>{result.etf_amount.toFixed(2)}</td></tr>

              <tr style={{ borderTop: "1px solid #ccc" }}>
                <td><strong>Deductions</strong></td>
                <td style={{ textAlign: "right" }}><strong>{result.deductions.toFixed(2)}</strong></td>
              </tr>

              <tr>
                <td><strong>Net Pay</strong></td>
                <td style={{ textAlign: "right" }}><strong>{result.net_amount.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: 12 }}>
            <button onClick={handleSave} style={{ marginRight: 8 }}>Save Payroll</button>
            <button onClick={() => { setResult(null); setMessage(""); }}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
