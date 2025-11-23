import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PayrollSettings() {
  const [form, setForm] = useState({
    epf_employee: "",
    epf_company: "",
    etf: "",
    year: "",
    month: "",
    ot_rate: ""
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load existing settings
  useEffect(() => {
    axios
      .get("http://localhost:3005/api/payroll/settings/latest")
      .then((res) => {
        if (res.data) setForm(res.data);
      })
      .catch(() => setError("Failed to load payroll settings"));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save / Update settings
  const save = () => {
    setMessage("");
    setError("");

    if (!form.year || !form.month) {
      setError("Year and Month are required");
      return;
    }

    axios
      .post("http://localhost:3005/api/payroll/settings", form)
      .then((res) => {
        setMessage(res.data.message);
      })
      .catch(() => setError("Error saving payroll settings"));
  };

  return (
    <div style={{ width: "400px", margin: "20px auto" }}>
      <h2>Payroll Settings</h2>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <label>EPF Employee (%)</label>
      <input type="number" name="epf_employee" value={form.epf_employee} onChange={handleChange} />

      <label>EPF Company (%)</label>
      <input type="number" name="epf_company" value={form.epf_company} onChange={handleChange} />

      <label>ETF Rate (%)</label>
      <input type="number" name="etf" value={form.etf} onChange={handleChange} />

      <label>Processing Year (YYYY)</label>
      <input type="number" name="year" value={form.year} onChange={handleChange} />

      <label>Processing Month (MM)</label>
      <input type="number" name="month" value={form.month} onChange={handleChange} />

      <label>OT Rate (Per Hour)</label>
      <input type="number" name="ot_rate" value={form.ot_rate} onChange={handleChange} />

      <br /><br />
      <button onClick={save}>Save</button>
    </div>
  );
}
