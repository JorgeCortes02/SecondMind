const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const pool = require("./db");
const bcrypt = require("bcrypt");
const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const crypto = require("crypto");
const { requireAuth } = require("./authMiddleware");
const sgMail = require("@sendgrid/mail");

// ✅ Configuración de SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post("/google", async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const googleId = payload["sub"];
    const email = payload["email"];
    const name = payload["name"];

    const result = await pool.query(
      `INSERT INTO users (google_id, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (google_id)
       DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
       RETURNING id`,
      [googleId, email, name]
    );

    const userId = result.rows[0].id;

    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: googleId, email: email, name: name, service: "googleLogin" },
    });
  } catch (error) {
    console.error("❌ Error auth Google:", error);
    res.status(401).json({ error: "Token inválido" });
  }
});

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son obligatorios" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    // generar token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // expira en 1 hora

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, verification_token, verification_expires)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name`,
      [email, passwordHash, name, verificationToken, expires]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const user = result.rows[0];
    const verifyUrl = `https://secondmind-h6hv.onrender.com/verificationMail/verify?token=${verificationToken}`;

    // ✅ enviar email con SendGrid
    const msg = {
      to: email,
      from: "seconmindmail@gmail.com", // 👈 correo verificado en SendGrid
      subject: "Verifica tu cuenta en SecondMind 🚀",
      html: `
        <body style="margin:0;padding:0;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #f0f8ff, #dce6ff, #fadcf0); padding:40px;">
          <div style="max-width:500px;margin:0 auto;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border-radius:30px;padding:30px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.15);">
            <h1 style="font-size:28px;color:#2f81d9;margin:0 0 10px;">Second<span style="color:#4781c6;">Mind</span></h1>
            <p style="font-size:16px;color:#333;margin:0 0 20px;">Organiza. Enfócate. Avanza 🚀</p>
            <p style="font-size:18px;color:#444;margin-bottom:20px;">Hola <b>${name}</b>,</p>
            <p style="font-size:16px;color:#555;margin-bottom:30px;">
              Gracias por registrarte en <b>SecondMind</b>. Para activar tu cuenta, haz clic en el botón:
            </p>
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(90deg, #2f81d9, #4781c6);color:#fff;font-size:16px;font-weight:600;text-decoration:none;border-radius:25px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
              ✅ Verificar mi cuenta
            </a>
            <p style="margin-top:30px;font-size:14px;color:#777;">Este enlace expirará en 1 hora.</p>
            <hr style="margin:30px 0;border:none;border-top:1px solid rgba(0,0,0,0.1);" />
            <p style="font-size:12px;color:#999;">© 2025 SecondMind ✨</p>
          </div>
        </body>
      `,
    };

    await sgMail.send(msg);

    res.json({ message: "Cuenta creada, revisa tu correo para verificarla ✉️" });
  } catch (err) {
    console.error("❌ Error en /register:", err);

if (err.response && err.response.body) {
  console.error("📩 Detalle de SendGrid:", JSON.stringify(err.response.body, null, 2));
}
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    `SELECT id, email, name, password_hash, is_verified
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const user = result.rows[0];

  if (!user.is_verified) {
    return res
      .status(403)
      .json({ error: "Cuenta no verificada. Revisa tu email 📧" });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, service: "SecondLogin" },
  });
});

router.put("/update-profile", requireAuth, async (req, res) => {
  const { name, email } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ error: "El nombre es obligatorio" });
  }

  try {
    let query, values;

    if (email && email.trim() !== "") {
      query = `
        UPDATE users
        SET name = $1, email = $2, updated_at = NOW()
        WHERE id = $3
      `;
      values = [name, email, req.user.userId];
    } else {
      query = `
        UPDATE users
        SET name = $1, updated_at = NOW()
        WHERE id = $2
      `;
      values = [name, req.user.userId];
    }

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.sendStatus(200); // ✅ éxito sin body
  } catch (err) {
    console.error("❌ Error en /update-profile:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

router.put("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.sendStatus(400);
  }

  try {
    const result = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.sendStatus(404);
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return res.sendStatus(401);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, req.user.userId]
    );

    res.sendStatus(200); // ✅ éxito
  } catch (err) {
    console.error("❌ Error en /change-password:", err);
    res.sendStatus(500);
  }
});

module.exports = router;