import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import PayrollSettings from "./pages/PayrollSettings";
import EmployeeManagement from "./components/EmployeeManagement/EmployeeManagement";
import SalaryProcessing from "./pages/SalaryProcessing";
import Attendance from "./pages/Attendance";




function App() {
  return (
    <Router>
      <div style={styles.container}>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <h2 style={styles.logo}>Payroll System</h2>
          <nav>
            <ul style={styles.navList}>
              <li><Link style={styles.link} to="/">Dashboard</Link></li>
              <li><Link style={styles.link} to="/employees">Employee Management</Link></li>
              <li><Link style={styles.link} to="/attendance">Attendance</Link></li>
              <li><Link style={styles.link} to="/settings">Payroll Settings</Link></li>
              <li><Link style={styles.link} to="/processing">Payroll Processing</Link></li>

            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.mainContent}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/settings" element={<PayrollSettings />} />
            <Route path="/processing" element={<SalaryProcessing />} />

          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "#f5f5f5",
  },
  sidebar: {
    width: "250px",
    background: "#1e1e2f",
    color: "white",
    padding: "20px",
  },
  logo: {
    fontSize: "22px",
    marginBottom: "30px",
  },
  navList: {
    listStyle: "none",
    padding: 0,
  },
  link: {
    display: "block",
    padding: "10px",
    color: "white",
    textDecoration: "none",
    fontSize: "16px",
  },
  mainContent: {
    flex: 1,
    padding: "30px",
  },
};
