const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const pool = require("./db");
const bcrypt = require("bcrypt");
const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});


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
       DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW()
       RETURNING id`,
      [googleId, email, name]
    );

    const userId = result.rows[0].id;

    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
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

    // enviar email
    const transporter = nodemailer.createTransport({
      service: "gmail", // o SMTP de tu hosting
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const verifyUrl = `https://tu-backend.com/auth/verify?token=${verificationToken}`;

   

await transporter.sendMail({
  from: '"SecondMind" <no-reply@secondmind.com>',
  to: email,
  subject: "Verifica tu cuenta en SecondMind 🚀",
  html: `
  <body style="margin:0;padding:0;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #f0f8ff, #dce6ff, #fadcf0); padding:40px;">
    <div style="max-width:500px;margin:0 auto;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border-radius:30px;padding:30px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.15);">
      
      <img src="https://secondmind.com/logo.png" alt="SecondMind" style="width:120px;height:auto;margin-bottom:20px;" />
      
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
  `
});

    res.json({ message: "Cuenta creada, revisa tu correo para verificarla ✉️" });
  } catch (err) {
    console.error("❌ Error en /register:", err);
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
    return res.status(403).json({ error: "Cuenta no verificada. Revisa tu email 📧" });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});
module.exports = router;