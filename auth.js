import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import pool from "./db.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verificar token de Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const googleId = payload["sub"];
    const email = payload["email"];
    const name = payload["name"];

    // Guardar/actualizar en PostgreSQL
    const result = await pool.query(
      `INSERT INTO users (google_id, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (google_id)
       DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, updated_at = NOW()
       RETURNING id`,
      [googleId, email, name]
    );

    const userId = result.rows[0].id;

    // Generar JWT propio
    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (error) {
    console.error("❌ Error auth Google:", error);
    res.status(401).json({ error: "Token inválido" });
  }
});

module.exports = router;