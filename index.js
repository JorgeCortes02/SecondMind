const express = require("express");
const cors = require("cors");

const authRoutes = require("./auth");
const verifyMail = require("./verificationMail");
const { requireAuth } = require("./authMiddleware");
const pool = require("./db");
const reminderRoutes = require("./routes/sendReminder"); // 👈 importamos la nueva ruta

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas públicas
app.use("/auth", authRoutes);
app.use("/verificationMail", verifyMail);

// Rutas protegidas
app.use("/reminder", reminderRoutes);

/* ============================================================
   PROJECTS
============================================================ */
app.get("/projects", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT external_id, title, description_project, status, user_id, last_opened_date
       FROM projects
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/projects", requireAuth, async (req, res) => {
  const { title, description_project, status = "on" } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO projects (title, description_project, status, user_id)
       VALUES ($1,$2,$3,$4)
       RETURNING external_id, title, description_project, status, user_id, last_opened_date`,
      [title, description_project, status, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   EVENTS
============================================================ */
app.get("/events", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT external_id, title, end_date, status, description_event, project_id, user_id
       FROM events
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/events", requireAuth, async (req, res) => {
  const { title, end_date, status = "on", description_event, project_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO events (title, end_date, status, description_event, project_id, user_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING external_id, title, end_date, status, description_event, project_id, user_id`,
      [title, end_date, status, description_event, project_id, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   TASKS
============================================================ */
app.get("/tasks", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT external_id, title, end_date, complete_date, status, description_task, project_id, event_id, user_id
       FROM task_items
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks", requireAuth, async (req, res) => {
  const { title, end_date, complete_date, status = "on", description_task, project_id, event_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO task_items (title, end_date, complete_date, status, description_task, project_id, event_id, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING external_id, title, end_date, complete_date, status, description_task, project_id, event_id, user_id`,
      [title, end_date, complete_date, status, description_task, project_id, event_id, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   NOTES
============================================================ */
app.get("/notes", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT external_id, title, content, event_id, user_id
       FROM notes
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/notes", requireAuth, async (req, res) => {
  const { title, content, event_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO notes (title, content, event_id, user_id)
       VALUES ($1,$2,$3,$4)
       RETURNING external_id, title, content, event_id, user_id`,
      [title, content, event_id, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   DOCUMENTS
============================================================ */
app.get("/documents", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT external_id, title, local_url, event_id, user_id
       FROM uploaded_documents
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/documents", requireAuth, async (req, res) => {
  const { title, local_url, event_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO uploaded_documents (title, local_url, event_id, user_id)
       VALUES ($1,$2,$3,$4)
       RETURNING external_id, title, local_url, event_id, user_id`,
      [title, local_url, event_id, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   SERVER
============================================================ */
app.get("/", (req, res) => {
  res.send("✅ API de SecondMind funcionando en Render");
});

app.listen(port, () => {
  console.log(`✅ API escuchando en puerto ${port}`);
});