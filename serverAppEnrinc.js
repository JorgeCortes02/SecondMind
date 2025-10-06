// serverAppEnrinc.js
const express = require("express");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const router = express.Router();

// ⚙️ API key de Hugging Face
const HF_API_KEY = process.env.HF_API_KEY;

// Ruta principal de resumen
router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No se proporcionó texto para resumir" });
  }

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/facebook/bart-large-cnn", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("⚠️ Error en Hugging Face:", data.error);
      return res.status(500).json({ error: data.error });
    }

    const summary = data[0]?.summary_text || "No se pudo generar el resumen.";
    res.json({ summary });
  } catch (error) {
    console.error("❌ Error interno al resumir:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;