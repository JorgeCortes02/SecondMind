const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const authRoutes = require("./auth");


const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);

// 🔹 Conexión a PostgreSQL (Render usa DATABASE_URL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/* ============================================================
   PROJECTS
============================================================ */

// Listar proyectos
app.get("/projects", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proyecto por id
app.get("/projects/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE id=$1", [req.params.id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear proyecto
app.post("/projects", async (req, res) => {
  const { title, description_project, status = "on" } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO projects (title, description_project, status) VALUES ($1, $2, $3) RETURNING *",
      [title, description_project, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar proyecto
app.put("/projects/:id", async (req, res) => {
  const { title, description_project, status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE projects SET title=$1, description_project=$2, status=$3, last_opened_date=NOW() WHERE id=$4 RETURNING *",
      [title, description_project, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Borrar proyecto
app.delete("/projects/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM projects WHERE id=$1", [req.params.id]);
    res.json({ message: "Proyecto eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proyectos activos
app.get("/projects/active", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE status='on' ORDER BY last_opened_date ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proyectos archivados
app.get("/projects/off", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE status='off'");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   EVENTS
============================================================ */

app.get("/events", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/events/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events WHERE id=$1", [req.params.id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/events", async (req, res) => {
  const { title, end_date, status = "on", description_event, project_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO events (title, end_date, status, description_event, project_id) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [title, end_date, status, description_event, project_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/events/:id", async (req, res) => {
  const { title, end_date, status, description_event, project_id } = req.body;
  try {
    const result = await pool.query(
      "UPDATE events SET title=$1, end_date=$2, status=$3, description_event=$4, project_id=$5 WHERE id=$6 RETURNING *",
      [title, end_date, status, description_event, project_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/events/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM events WHERE id=$1", [req.params.id]);
    res.json({ message: "Evento eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eventos de hoy
app.get("/events/today", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM events
      WHERE end_date >= date_trunc('day', now())
        AND end_date < date_trunc('day', now()) + interval '1 day'
        AND status='on'
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eventos de un proyecto
app.get("/events/byproject/:projectId", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events WHERE project_id=$1 AND status='on'", [req.params.projectId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eventos de la última semana
app.get("/events/lastweek", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events WHERE end_date >= now() - interval '7 days' AND status='off'");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   TASKS
============================================================ */

app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM task_items ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/tasks/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM task_items WHERE id=$1", [req.params.id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks", async (req, res) => {
  const { title, end_date, complete_date, status = "on", description_task, project_id, event_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO task_items (title,end_date,complete_date,status,description_task,project_id,event_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [title, end_date, complete_date, status, description_task, project_id, event_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/tasks/:id", async (req, res) => {
  const { title, end_date, complete_date, status, description_task, project_id, event_id } = req.body;
  try {
    const result = await pool.query(
      "UPDATE task_items SET title=$1,end_date=$2,complete_date=$3,status=$4,description_task=$5,project_id=$6,event_id=$7 WHERE id=$8 RETURNING *",
      [title, end_date, complete_date, status, description_task, project_id, event_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM task_items WHERE id=$1", [req.params.id]);
    res.json({ message: "Tarea eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tareas de hoy
app.get("/tasks/today", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM task_items
      WHERE end_date >= date_trunc('day', now())
        AND end_date < date_trunc('day', now()) + interval '1 day'
        AND status='on'
      ORDER BY end_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tareas por fecha
app.get("/tasks/bydate", async (req, res) => {
  const { date } = req.query;
  try {
    const result = await pool.query(
      "SELECT * FROM task_items WHERE end_date::date=$1::date AND status='on' ORDER BY end_date ASC",
      [date]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tareas sin fecha
app.get("/tasks/nodate", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM task_items WHERE end_date IS NULL AND status='on'");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Última tarea borrada
app.get("/tasks/lastdelete", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM last_delete_task WHERE date IS NOT NULL ORDER BY date DESC LIMIT 1");
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks/lastdelete", async (req, res) => {
  const { date } = req.body;
  try {
    const result = await pool.query("INSERT INTO last_delete_task (date) VALUES ($1) RETURNING *", [date]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   NOTES
============================================================ */

app.get("/notes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM notes ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/notes", async (req, res) => {
  const { title, content, event_id } = req.body;
  try {
    const result = await pool.query("INSERT INTO notes (title,content,event_id) VALUES ($1,$2,$3) RETURNING *", [
      title,
      content,
      event_id,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/notes/:id", async (req, res) => {
  const { title, content, event_id } = req.body;
  try {
    const result = await pool.query(
      "UPDATE notes SET title=$1, content=$2, event_id=$3 WHERE id=$4 RETURNING *",
      [title, content, event_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/notes/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE id=$1", [req.params.id]);
    res.json({ message: "Nota eliminada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   DOCUMENTS
============================================================ */

app.get("/documents", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM uploaded_documents ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/documents", async (req, res) => {
  const { title, local_url, event_id } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO uploaded_documents (title, local_url, event_id) VALUES ($1,$2,$3) RETURNING *",
      [title, local_url, event_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/documents/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM uploaded_documents WHERE id=$1", [req.params.id]);
    res.json({ message: "Documento eliminado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   SERVER
============================================================ */
// Ruta raíz para pruebas
app.get("/", (req, res) => {
  res.send("✅ API de SecondMind funcionando en Render");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API escuchando en puerto ${PORT}`);
});