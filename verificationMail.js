const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");



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

    res.send("✅ Tu cuenta ha sido verificada, ya puedes iniciar sesión en la app.");
  } catch (err) {
    console.error("❌ Error en /verify:", err);
    res.status(500).send("Error interno");
  }
});