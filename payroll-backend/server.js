// server.js
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3005;

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- DB SETUP ----------
const dbFile = path.join(__dirname, "employee.db");
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) console.error("❌ DB connection failed:", err);
  else console.log("✅ Connected to SQLite database");
});

// Create tables (if not exists)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      epfNo TEXT,
      name TEXT,
      nic TEXT,
      department TEXT,
      position TEXT,
      employee_type TEXT,
      epf_active TEXT,
      address TEXT,
      phone TEXT,
      gender TEXT,
      dob TEXT,
      basicSalary REAL DEFAULT 0,
      allowance REAL DEFAULT 0,
      pra REAL DEFAULT 0,
      incentive REAL DEFAULT 0,
      profile_photo TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payroll_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      epf_employee REAL DEFAULT 0,
      epf_company REAL DEFAULT 0,
      etf REAL DEFAULT 0,
      year INTEGER,
      month INTEGER,
      ot_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payroll_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      basicSalary REAL DEFAULT 0,
      allowance REAL DEFAULT 0,
      pra REAL DEFAULT 0,
      incentive REAL DEFAULT 0,
      ot_hours REAL DEFAULT 0,
      ot_amount REAL DEFAULT 0,
      epf_employee_amount REAL DEFAULT 0,
      epf_company_amount REAL DEFAULT 0,
      etf_amount REAL DEFAULT 0,
      gross_amount REAL DEFAULT 0,
      deductions REAL DEFAULT 0,
      net_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      date TEXT,
      status TEXT,
      ot_hours REAL DEFAULT 0,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    )
  `);
});

// ---------- UPLOAD SETUP ----------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📂 Created uploads directory");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------- ROOT ----------
app.get("/", (req, res) => res.send("✅ Payroll backend is running!"));

// ---------- EMPLOYEE CRUD ----------

// Create employee
// Check duplicates before insert or update
db.get(
  `SELECT * FROM employees WHERE (epfNo = ? OR nic = ? OR phone = ?) AND id != ?`,
  [epfNo, nic, phone, id || 0],
  (err, row) => {
    if (row) {
      return res.status(400).json({ error: "Duplicate entry found" });
    }

    // continue saving...
  }
);

app.post("/employees", upload.single("profile_photo"), (req, res) => {
  try {
    const d = req.body || {};
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const params = [
      d.epfNo || null,
      d.name || null,
      d.nic || null,
      d.department || null,
      d.position || null,
      d.employee_type || null,
      d.epf_active || null,
      d.address || null,
      d.phone || null,
      d.gender || null,
      d.dob || null,
      Number(d.basicSalary) || 0,
      Number(d.allowance) || 0,
      Number(d.pra) || 0,
      Number(d.incentive) || 0,
      photoPath,
    ];

    const q = `
      INSERT INTO employees
      (epfNo, name, nic, department, position, employee_type, epf_active, address, phone, gender, dob, basicSalary, allowance, pra, incentive, profile_photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(q, params, function (err) {
      if (err) {
        console.error("❌ Insert employee error:", err);
        return res.status(500).json({ error: err.message });
      }
      return res.json({ message: "Employee added", id: this.lastID });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error", details: e.message });
  }
});

// Read all employees
app.get("/employees", (req, res) => {
  db.all("SELECT * FROM employees ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Read single employee
app.get("/employees/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM employees WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Employee not found" });
    res.json(row);
  });
});

// Update employee (supports new profile photo)
app.put("/employees/:id", upload.single("profile_photo"), (req, res) => {
  const id = req.params.id;
  const d = req.body || {};

  db.get("SELECT profile_photo FROM employees WHERE id = ?", [id], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });

    // compute new profile photo path
    const newPhoto = req.file ? `/uploads/${req.file.filename}` : (d.profile_photo || existing && existing.profile_photo);

    const q = `
      UPDATE employees SET
        epfNo = ?, name = ?, nic = ?, department = ?, position = ?, 
        employee_type = ?, epf_active = ?, address = ?, phone = ?, 
        gender = ?, dob = ?, basicSalary = ?, allowance = ?, pra = ?, 
        incentive = ?, profile_photo = ?
      WHERE id = ?
    `;
    const params = [
      d.epfNo || null,
      d.name || null,
      d.nic || null,
      d.department || null,
      d.position || null,
      d.employee_type || null,
      d.epf_active || null,
      d.address || null,
      d.phone || null,
      d.gender || null,
      d.dob || null,
      Number(d.basicSalary) || 0,
      Number(d.allowance) || 0,
      Number(d.pra) || 0,
      Number(d.incentive) || 0,
      newPhoto || null,
      id,
    ];

    db.run(q, params, function (err2) {
      if (err2) {
        console.error("❌ Update employee error:", err2);
        return res.status(500).json({ error: err2.message });
      }

      // delete old file if replaced
      if (req.file && existing && existing.profile_photo) {
        const oldPath = path.join(__dirname, existing.profile_photo);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { /* ignore unlink errors */ }
        }
      }

      if (this.changes === 0) return res.status(404).json({ error: "Employee not found" });
      res.json({ message: "Employee updated" });
    });
  });
});

// Delete employee
app.delete("/employees/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT profile_photo FROM employees WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    db.run("DELETE FROM employees WHERE id = ?", [id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });

      // remove profile photo from disk
      if (row && row.profile_photo) {
        const filePath = path.join(__dirname, row.profile_photo);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
        }
      }

      if (this.changes === 0) return res.status(404).json({ error: "Employee not found" });
      res.json({ message: "Employee deleted" });
    });
  });
});

// ---------- PAYROLL SETTINGS ----------

// Save or update payroll settings (single-row approach)
app.post("/api/payroll/settings", (req, res) => {
  const { epf_employee = 0, epf_company = 0, etf = 0, year, month, ot_rate = 0 } = req.body;

  if (!year || !month) {
    return res.status(400).json({ success: false, message: "Year and month required" });
  }

  db.get("SELECT id FROM payroll_settings LIMIT 1", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) {
      db.run(
        `INSERT INTO payroll_settings (epf_employee, epf_company, etf, year, month, ot_rate) VALUES (?, ?, ?, ?, ?, ?)`,
        [epf_employee, epf_company, etf, year, month, ot_rate],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ success: true, message: "Settings saved", id: this.lastID });
        }
      );
    } else {
      db.run(
        `UPDATE payroll_settings SET epf_employee=?, epf_company=?, etf=?, year=?, month=?, ot_rate=? WHERE id=?`,
        [epf_employee, epf_company, etf, year, month, ot_rate, row.id],
        function (err3) {
          if (err3) return res.status(500).json({ error: err3.message });
          res.json({ success: true, message: "Settings updated" });
        }
      );
    }
  });
});

// Get latest payroll settings
app.get("/api/payroll/settings/latest", (req, res) => {
  db.get("SELECT * FROM payroll_settings ORDER BY id DESC LIMIT 1", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

// ---------- PAYROLL CALCULATION & SAVE ----------

// Calculate payroll (does not save)
app.post("/api/payroll/calculate", (req, res) => {
  const { employeeId, year, month, ot_hours = 0 } = req.body;
  if (!employeeId || !year || !month) return res.status(400).json({ error: "employeeId, year and month required" });

  db.get("SELECT * FROM employees WHERE id = ?", [employeeId], (err, emp) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!emp) return res.status(404).json({ error: "Employee not found" });

    db.get("SELECT * FROM payroll_settings ORDER BY id DESC LIMIT 1", [], (err2, settings) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const epf_employee_pct = settings ? Number(settings.epf_employee) : 0;
      const epf_company_pct = settings ? Number(settings.epf_company) : 0;
      const etf_pct = settings ? Number(settings.etf) : 0;
      const ot_rate = settings ? Number(settings.ot_rate) : 0;

      const basicSalary = Number(emp.basicSalary) || 0;
      const allowance = Number(emp.allowance) || 0;
      const pra = Number(emp.pra) || 0;
      const incentive = Number(emp.incentive) || 0;
      const otHours = Number(ot_hours) || 0;

      const otAmount = +(otHours * ot_rate).toFixed(2);
      const gross = +(basicSalary + allowance + pra + incentive + otAmount).toFixed(2);

      const epfEmployeeAmount = +(basicSalary * (epf_employee_pct / 100)).toFixed(2);
      const epfCompanyAmount = +(basicSalary * (epf_company_pct / 100)).toFixed(2);
      const etfAmount = +(basicSalary * (etf_pct / 100)).toFixed(2);

      const deductions = epfEmployeeAmount;
      const net = +(gross - deductions).toFixed(2);

      return res.json({
        employee: { id: emp.id, name: emp.name, epfNo: emp.epfNo },
        year: Number(year),
        month: Number(month),
        basicSalary, allowance, pra, incentive,
        ot_hours: otHours, ot_amount: otAmount,
        epf_employee_pct, epf_company_pct, etf_pct,
        epf_employee_amount: epfEmployeeAmount,
        epf_company_amount: epfCompanyAmount,
        etf_amount: etfAmount,
        gross_amount: gross,
        deductions, net_amount: net
      });
    });
  });
});

// Save payroll record
app.post("/api/payroll/save", (req, res) => {
  const payload = req.body;
  const required = ["employee_id", "year", "month", "net_amount"];
  for (let f of required) {
    if (payload[f] === undefined) return res.status(400).json({ error: `Missing ${f}` });
  }

  const q = `INSERT INTO payroll_records
    (employee_id, year, month, basicSalary, allowance, pra, incentive, ot_hours, ot_amount, epf_employee_amount, epf_company_amount, etf_amount, gross_amount, deductions, net_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [
    payload.employee_id, payload.year, payload.month,
    Number(payload.basicSalary) || 0,
    Number(payload.allowance) || 0,
    Number(payload.pra) || 0,
    Number(payload.incentive) || 0,
    Number(payload.ot_hours) || 0,
    Number(payload.ot_amount) || 0,
    Number(payload.epf_employee_amount) || 0,
    Number(payload.epf_company_amount) || 0,
    Number(payload.etf_amount) || 0,
    Number(payload.gross_amount) || 0,
    Number(payload.deductions) || 0,
    Number(payload.net_amount) || 0
  ];

  db.run(q, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Payroll record saved", id: this.lastID });
  });
});

// List payroll records for month
app.get("/api/payroll/records", (req, res) => {
  const year = Number(req.query.year) || null;
  const month = Number(req.query.month) || null;
  if (!year || !month) return res.status(400).json({ error: "year and month required" });

  const q = `
    SELECT pr.*, e.name, e.epfNo, e.department
    FROM payroll_records pr
    JOIN employees e ON pr.employee_id = e.id
    WHERE pr.year = ? AND pr.month = ?
    ORDER BY e.name
  `;
  db.all(q, [year, month], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Generate payroll for ALL employees for a month (uses attendance)
app.post("/api/payroll/generate", (req, res) => {
  const { year, month } = req.body;
  if (!year || !month) return res.status(400).json({ error: "year and month required" });

  db.get("SELECT * FROM payroll_settings ORDER BY id DESC LIMIT 1", [], (err, settings) => {
    if (err) return res.status(500).json({ error: err.message });

    const epf_employee_pct = settings ? Number(settings.epf_employee) : 0;
    const epf_company_pct = settings ? Number(settings.epf_company) : 0;
    const etf_pct = settings ? Number(settings.etf) : 0;
    const ot_rate = settings ? Number(settings.ot_rate) : 0;

    // date range
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = `${year}-${String(month).padStart(2, "0")}-31`;

    db.all("SELECT * FROM employees", [], (err2, employees) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (!employees || employees.length === 0) return res.json({ message: "No employees" });

      // Use a serial approach to avoid too many parallel DB writes — iterate with index
      let processed = 0;
      const results = [];

      const processNext = (i) => {
        if (i >= employees.length) {
          return res.json({ message: "Payroll generated", details: results });
        }
        const emp = employees[i];

        db.all(
          `SELECT status, ot_hours FROM attendance WHERE employee_id=? AND date BETWEEN ? AND ?`,
          [emp.id, start, end],
          (err3, rows) => {
            if (err3) {
              results.push({ employee_id: emp.id, error: err3.message });
              processed++;
              return processNext(i + 1);
            }

            const otHours = (rows || []).reduce((s, r) => s + (Number(r.ot_hours) || 0), 0);
            const basicSalary = Number(emp.basicSalary) || 0;
            const allowance = Number(emp.allowance) || 0;
            const pra = Number(emp.pra) || 0;
            const incentive = Number(emp.incentive) || 0;
            const otAmount = +(otHours * ot_rate).toFixed(2);
            const gross = +(basicSalary + allowance + pra + incentive + otAmount).toFixed(2);

            const epfEmployeeAmount = +(basicSalary * (epf_employee_pct / 100)).toFixed(2);
            const epfCompanyAmount = +(basicSalary * (epf_company_pct / 100)).toFixed(2);
            const etfAmount = +(basicSalary * (etf_pct / 100)).toFixed(2);

            const deductions = epfEmployeeAmount;
            const net = +(gross - deductions).toFixed(2);

            const insertQ = `
              INSERT INTO payroll_records
              (employee_id, year, month, basicSalary, allowance, pra, incentive, ot_hours, ot_amount, epf_employee_amount, epf_company_amount, etf_amount, gross_amount, deductions, net_amount)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
              emp.id, Number(year), Number(month),
              basicSalary, allowance, pra, incentive,
              otHours, otAmount,
              epfEmployeeAmount, epfCompanyAmount, etfAmount,
              gross, deductions, net
            ];

            db.run(insertQ, params, function (err4) {
              if (err4) results.push({ employee_id: emp.id, error: err4.message });
              else results.push({ employee_id: emp.id, payroll_id: this.lastID });
              processed++;
              processNext(i + 1);
            });
          }
        );
      };

      processNext(0);
    });
  });
});

// ---------- ATTENDANCE ROUTES ----------

// Add attendance record
app.post("/api/attendance", (req, res) => {
  const { employee_id, date, status, ot_hours = 0, note = null } = req.body;
  if (!employee_id || !date || !status) return res.status(400).json({ error: "employee_id, date and status required" });

  const q = `INSERT INTO attendance (employee_id, date, status, ot_hours, note) VALUES (?, ?, ?, ?, ?)`;
  db.run(q, [employee_id, date, status, Number(ot_hours) || 0, note], function (err) {
    if (err) {
      console.error("Attendance insert error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Attendance saved", id: this.lastID });
  });
});

// Get attendance list for employee/month
app.get("/api/attendance/list/:employeeId/:year/:month", (req, res) => {
  const { employeeId, year, month } = req.params;
  if (!employeeId || !year || !month) return res.status(400).json({ error: "Missing params" });

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;

  db.all(`SELECT * FROM attendance WHERE employee_id = ? AND date BETWEEN ? AND ? ORDER BY date`, [employeeId, start, end], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Attendance summary (rows + aggregated)
app.get("/api/attendance/summary/:employeeId/:year/:month", (req, res) => {
  const { employeeId, year, month } = req.params;
  if (!employeeId || !year || !month) return res.status(400).json({ error: "Missing params" });

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = `${year}-${String(month).padStart(2, "0")}-31`;

  db.all(`SELECT status, ot_hours, date, id, note FROM attendance WHERE employee_id = ? AND date BETWEEN ? AND ? ORDER BY date`, [employeeId, start, end], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const summary = { present: 0, absent: 0, leave: 0, ot_hours: 0, days_count: (rows || []).length };
    (rows || []).forEach(r => {
      const st = String(r.status).toLowerCase();
      if (st === "present") summary.present += 1;
      else if (st === "absent") summary.absent += 1;
      else if (st === "leave") summary.leave += 1;
      summary.ot_hours += Number(r.ot_hours) || 0;
    });

    res.json({ rows, summary });
  });
});

// Delete attendance record
app.delete("/api/attendance/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM attendance WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Attendance deleted" });
  });
});

// ---------- START SERVER ----------
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
