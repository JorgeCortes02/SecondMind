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
    console.log("📥 GET /projects | user:", req.user.userId);
    const result = await pool.query(
      `SELECT external_id, title, description_project, status, last_opened_date
       FROM projects
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.userId]
    );
    console.log("✅ Projects encontrados:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en GET /projects:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/projects", requireAuth, async (req, res) => {
  console.log("📥 POST /projects | body:", req.body, "user:", req.user.userId);
  const { external_id, title, description_project, status = "on" } = req.body;
  try {
    await pool.query(
      `INSERT INTO projects (external_id, title, description_project, status, user_id)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (external_id) DO UPDATE SET
         title=EXCLUDED.title,
         description_project=EXCLUDED.description_project,
         status=EXCLUDED.status`,
      [external_id, title, description_project, status, req.user.userId]
    );
    console.log("✅ Project guardado:", external_id);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en POST /projects:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   EVENTS
============================================================ */
app.get("/events", requireAuth, async (req, res) => {
  try {
    console.log("📥 GET /events | user:", req.user.userId);
    const result = await pool.query(
      `SELECT external_id, title, end_date, status, description_event,
              address, latitude, longitude,
              (SELECT external_id FROM projects WHERE id=events.project_id) AS project_external_id
       FROM events
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.userId]
    );
    console.log("✅ Events encontrados:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en GET /events:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/events", requireAuth, async (req, res) => {
  console.log("📥 POST /events | body:", req.body, "user:", req.user.userId);
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
    await pool.query(
      `INSERT INTO events (external_id, title, end_date, status, description_event, project_id, user_id, address, latitude, longitude)
       VALUES (
         $1, $2, $3, $4, $5,
         (SELECT id FROM projects WHERE external_id=$6 AND user_id=$7),
         $7, $8, $9, $10
       )
       ON CONFLICT (external_id) DO UPDATE SET
         title=EXCLUDED.title,
         end_date=EXCLUDED.end_date,
         status=EXCLUDED.status,
         description_event=EXCLUDED.description_event,
         project_id=EXCLUDED.project_id,
         address=EXCLUDED.address,
         latitude=EXCLUDED.latitude,
         longitude=EXCLUDED.longitude`,
      [
        external_id, title, end_date, status, description_event,
        project_external_id, req.user.userId,
        address, latitude, longitude
      ]
    );
    console.log("✅ Event guardado:", external_id);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en POST /events:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   TASKS
============================================================ */
app.get("/tasks", requireAuth, async (req, res) => {
  try {
    console.log("📥 GET /tasks | user:", req.user.userId);
    const result = await pool.query(
      `SELECT external_id, title, end_date, complete_date, status, description_task,
              (SELECT external_id FROM projects WHERE id=task_items.project_id) AS project_external_id,
              (SELECT external_id FROM events WHERE id=task_items.event_id) AS event_external_id
       FROM task_items
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.userId]
    );
    console.log("✅ Tasks encontrados:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en GET /tasks:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks", requireAuth, async (req, res) => {
  console.log("📥 POST /tasks | body:", req.body, "user:", req.user.userId);
  const {
    external_id,
    title,
    end_date,
    complete_date,
    status = "on",
    description_task,
    project_external_id,
    event_external_id
  } = req.body;
  try {
    await pool.query(
      `INSERT INTO task_items (external_id, title, end_date, complete_date, status, description_task, project_id, event_id, user_id)
       VALUES (
         $1,$2,$3,$4,$5,$6,
         (SELECT id FROM projects WHERE external_id=$7 AND user_id=$9),
         (SELECT id FROM events WHERE external_id=$8 AND user_id=$9),
         $9
       )
       ON CONFLICT (external_id) DO UPDATE SET
         title=EXCLUDED.title,
         end_date=EXCLUDED.end_date,
         complete_date=EXCLUDED.complete_date,
         status=EXCLUDED.status,
         description_task=EXCLUDED.description_task,
         project_id=EXCLUDED.project_id,
         event_id=EXCLUDED.event_id`,
      [
        external_id, title, end_date, complete_date, status,
        description_task, project_external_id,
        event_external_id, req.user.userId
      ]
    );
    console.log("✅ Task guardado:", external_id);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en POST /tasks:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   NOTES
============================================================ */
app.get("/notes", requireAuth, async (req, res) => {
  try {
    console.log("📥 GET /notes | user:", req.user.userId);
    const result = await pool.query(
      `SELECT external_id, title, content,
              (SELECT external_id FROM events WHERE id=notes.event_id) AS event_external_id,
              (SELECT external_id FROM projects WHERE id=notes.project_id) AS project_external_id,
              created_at, updated_at, is_favorite, is_archived
       FROM notes
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.userId]
    );
    console.log("✅ Notes encontrados:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en GET /notes:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/notes", requireAuth, async (req, res) => {
  console.log("📥 POST /notes | body:", req.body, "user:", req.user.userId);
  const {
    external_id,
    title,
    content,
    project_external_id,
    event_external_id,
    created_at,
    updated_at,
    is_favorite,
    is_archived
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO notes (external_id, title, content, project_id, event_id, user_id, created_at, updated_at, is_favorite, is_archived)
       VALUES (
         $1,$2,$3,
         (SELECT id FROM projects WHERE external_id=$4 AND user_id=$9),
         (SELECT id FROM events WHERE external_id=$5 AND user_id=$9),
         $9,$6,$7,$8,$10
       )
       ON CONFLICT (external_id) DO UPDATE SET
         title=EXCLUDED.title,
         content=EXCLUDED.content,
         project_id=EXCLUDED.project_id,
         event_id=EXCLUDED.event_id,
         created_at=EXCLUDED.created_at,
         updated_at=EXCLUDED.updated_at,
         is_favorite=EXCLUDED.is_favorite,
         is_archived=EXCLUDED.is_archived`,
      [
        external_id, title, content, project_external_id,
        event_external_id, created_at, updated_at,
        is_favorite, req.user.userId, is_archived
      ]
    );
    console.log("✅ Note guardada:", external_id);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en POST /notes:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   DOCUMENTS
============================================================ */
app.get("/documents", requireAuth, async (req, res) => {
  try {
    console.log("📥 GET /documents | user:", req.user.userId);
    const result = await pool.query(
      `SELECT external_id, title, local_url,
              (SELECT external_id FROM events WHERE id=uploaded_documents.event_id) AS event_external_id,
              upload_date
       FROM uploaded_documents
       WHERE user_id=$1
       ORDER BY id DESC`,
      [req.user.userId]
    );
    console.log("✅ Documents encontrados:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error en GET /documents:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/documents", requireAuth, async (req, res) => {
  console.log("📥 POST /documents | body:", req.body, "user:", req.user.userId);
  const { external_id, title, local_url, event_external_id } = req.body;
  try {
    await pool.query(
      `INSERT INTO uploaded_documents (external_id, title, local_url, event_id, user_id)
       VALUES (
         $1,$2,$3,
         (SELECT id FROM events WHERE external_id=$4 AND user_id=$5),
         $5
       )
       ON CONFLICT (external_id) DO UPDATE SET
         title=EXCLUDED.title,
         local_url=EXCLUDED.local_url,
         event_id=EXCLUDED.event_id`,
      [external_id, title, local_url, event_external_id, req.user.userId]
    );
    console.log("✅ Document guardado:", external_id);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en POST /documents:", err);
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