const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const dbFile = path.join(__dirname, "employee.db");
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) console.error("❌ DB connection failed:", err);
  else console.log("✅ Connected to SQLite database");
});

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
    basicSalary REAL,
    allowance REAL,
    pra REAL,
    incentive REAL,
    profile_photo TEXT
  )
`);

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📂 Created uploads directory");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.get("/", (req, res) => res.send("✅ Payroll backend is running!"));

app.post("/employees", upload.single("profile_photo"), (req, res) => {
  try {
    const data = {
      epfNo: req.body.epfNo || null,
      name: req.body.name || null,
      nic: req.body.nic || null,
      department: req.body.department || null,
      position: req.body.position || null,
      employee_type: req.body.employee_type || null,
      epf_active: req.body.epf_active || null,
      address: req.body.address || null,
      phone: req.body.phone || null,
      gender: req.body.gender || null,
      dob: req.body.dob || null,
      basicSalary: parseFloat(req.body.basicSalary) || 0,
      allowance: parseFloat(req.body.allowance) || 0,
      pra: parseFloat(req.body.pra) || 0,
      incentive: parseFloat(req.body.incentive) || 0,
      profile_photo: req.file ? `/uploads/${req.file.filename}` : null,
    };

    const q = `
      INSERT INTO employees
      (epfNo, name, nic, department, position, employee_type, epf_active, address, phone, gender, dob, basicSalary, allowance, pra, incentive, profile_photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(
      q,
      [
        data.epfNo, data.name, data.nic, data.department, data.position,
        data.employee_type, data.epf_active, data.address, data.phone,
        data.gender, data.dob, data.basicSalary, data.allowance,
        data.pra, data.incentive, data.profile_photo
      ],
      function (err) {
        if (err) {
          console.error("❌ Insert error:", err.message);
          return res.status(500).json({ error: "DB insert failed", details: err.message });
        }
        res.json({ message: "Employee added", id: this.lastID });
      }
    );
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Unexpected server error" });
  }
});

app.get("/employees", (req, res) => {
  db.all("SELECT * FROM employees ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put("/employees/:id", upload.single("profile_photo"), (req, res) => {
  const id = req.params.id;
  db.get("SELECT profile_photo FROM employees WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    const profile_photo = req.file ? `/uploads/${req.file.filename}` : (req.body.profile_photo || row?.profile_photo || null);

    const q = `
      UPDATE employees SET
        epfNo=?, name=?, nic=?, department=?, position=?, employee_type=?, epf_active=?, address=?, phone=?, gender=?, dob=?, basicSalary=?, allowance=?, pra=?, incentive=?, profile_photo=?
      WHERE id=?
    `;
    const params = [
      req.body.epfNo, req.body.name, req.body.nic, req.body.department, req.body.position,
      req.body.employee_type, req.body.epf_active, req.body.address, req.body.phone,
      req.body.gender, req.body.dob, parseFloat(req.body.basicSalary) || 0,
      parseFloat(req.body.allowance) || 0, parseFloat(req.body.pra) || 0,
      parseFloat(req.body.incentive) || 0, profile_photo, id
    ];

    db.run(q, params, function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      if (req.file && row && row.profile_photo) {
        const oldPath = path.join(__dirname, row.profile_photo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      res.json({ message: "Employee updated" });
    });
  });
});

app.delete("/employees/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT profile_photo FROM employees WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run("DELETE FROM employees WHERE id = ?", [id], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      if (row && row.profile_photo) {
        const filePath = path.join(__dirname, row.profile_photo);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      res.json({ message: "Employee deleted" });
    });
  });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));