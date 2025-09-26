const express = require("express");
const cors = require("cors");

const authRoutes = require("./auth");
const verifyMail = require("./verificationMail");
const { requireAuth } = require("./authMiddleware");
const pool = require("./db");
const reminderRoutes = require("./sendEventNotification");

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
      `SELECT external_id, title, description_project, status, last_opened_date
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
       RETURNING external_id, title, description_project, status, last_opened_date`,
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
      `SELECT external_id, title, end_date, status, description_event,
              project_external_id, address, latitude, longitude
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
  const {
    external_id,
    title,
    end_date,
    status = "on",
    description_event,
    project_external_id,
    address,
    latitude,
    longitude
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO events (external_id, title, end_date, status, description_event, project_id, user_id, address, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5,
               (SELECT id FROM projects WHERE external_id=$6 AND user_id=$10),
               $7,$8,$9,$10)
       ON CONFLICT (external_id) DO UPDATE SET
         title=EXCLUDED.title,
         end_date=EXCLUDED.end_date,
         status=EXCLUDED.status,
         description_event=EXCLUDED.description_event,
         project_id=EXCLUDED.project_id,
         address=EXCLUDED.address,
         latitude=EXCLUDED.latitude,
         longitude=EXCLUDED.longitude
       RETURNING external_id, title, end_date, status, description_event, project_id, address, latitude, longitude`,
      [
        external_id,
        title,
        end_date,
        status,
        description_event,
        project_external_id,
        req.user.userId,
        address,
        latitude,
        longitude,
        req.user.userId
      ]
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
      `SELECT external_id, title, end_date, complete_date, status, description_task, project_id, event_id
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
       RETURNING external_id, title, end_date, complete_date, status, description_task, project_id, event_id`,
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
      `SELECT external_id, title, content, event_id
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
       RETURNING external_id, title, content, event_id`,
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
      `SELECT external_id, title, local_url, event_id
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
       RETURNING external_id, title, local_url, event_id`,
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



