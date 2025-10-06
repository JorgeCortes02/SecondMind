const express = require("express");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const router = express.Router();

// 👉 Sustituye esto con tu propia API key de RapidAPI (no se caduca fácilmente)
const RAPID_API_KEY = process.env.RAPID_API_KEY;

router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "No se proporcionó texto para resumir" });
  }

  try {
    const response = await fetch("https://twinword-text-summarization-v1.p.rapidapi.com/summarize/", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "X-RapidAPI-Key": RAPID_API_KEY,
        "X-RapidAPI-Host": "twinword-text-summarization-v1.p.rapidapi.com"
      },
      body: new URLSearchParams({ text })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("⚠️ Error de API:", data);
      return res.status(500).json({ error: data.message || "Error de API" });
    }

    const summary = data.summary || "No se pudo generar el resumen.";
    res.json({ summary });
  } catch (error) {
    console.error("❌ Error interno:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;