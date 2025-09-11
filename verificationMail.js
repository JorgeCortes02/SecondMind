const express = require("express");
const router = express.Router();
const pool = require("./db"); // 👈 importa la conexión a la DB

// GET /verify?token=xxxxx
router.get("/verify", async (req, res) => {
  const { token } = req.query;

  try {
    const result = await pool.query(
      `SELECT id FROM users WHERE verification_token = $1 AND verification_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send("❌ Token inválido o expirado");

    }

    const userId = result.rows[0].id;

    await pool.query(
      `UPDATE users
       SET is_verified = TRUE, verification_token = NULL, verification_expires = NULL
       WHERE id = $1`,
      [userId]
    );

    res.send(`
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cuenta verificada</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        background: linear-gradient(135deg, #f0f8ff, #e6e9ff, #ffe6f0);
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0;
      }
      .card {
        background: rgba(255, 255, 255, 0.85);
        border-radius: 20px;
        padding: 40px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 8px 30px rgba(0,0,0,0.1);
        backdrop-filter: blur(10px);
      }
      h1 {
        font-size: 28px;
        margin-bottom: 10px;
        color: #2f81c6;
      }
      p {
        font-size: 16px;
        color: #333;
        margin-bottom: 20px;
      }
      .check {
        font-size: 60px;
        color: #4CAF50;
        margin-bottom: 20px;
      }
      .footer {
        font-size: 12px;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="check">✅</div>
      <h1>Cuenta verificada</h1>
      <p>¡Tu correo ha sido confirmado correctamente!<br>
      Ahora ya puedes iniciar sesión en la app <strong>SecondMind</strong>.</p>
      <div class="footer">© 2025 SecondMind ✨</div>
    </div>
  </body>
  </html>
`);
  } catch (err) {
    console.error("❌ Error en /verify:", err);
    res.status(500).send("Error interno");
  }
});

module.exports = router;