// serverAppEnrinc.js
const express = require("express");
const router = express.Router();
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const HF_API_KEY = process.env.HF_API_KEY;

// Log para verificar variable
console.log("🔑 HF_API_KEY presente:", !!HF_API_KEY, "| valor:", HF_API_KEY ? HF_API_KEY.slice(0, 10) + "..." : "undefined");

// Ruta principal de resumen
router.post("/", async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === "") {
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

    const rawText = await response.text();

    // Verificación: ¿es JSON o HTML?
    if (rawText.trim().startsWith("<")) {
      console.error("⚠️ Hugging Face devolvió HTML (posible error 403 o 500):\n", rawText.slice(0, 200));
      return res.status(502).json({
        error: "La API de Hugging Face devolvió HTML en lugar de JSON (revisa tu API key o estado del modelo)",
      });
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      console.error("❌ Error al parsear JSON:", err, "\nRespuesta bruta:", rawText.slice(0, 200));
      return res.status(502).json({ error: "Respuesta inválida desde Hugging Face" });
    }

    if (!response.ok) {
      console.error("⚠️ Error HTTP desde Hugging Face:", response.status, data);
      return res.status(response.status).json({ error: data.error || "Error en Hugging Face" });
    }

    const summary = data[0]?.summary_text || "No se pudo generar el resumen.";
    return res.json({ summary });
  } catch (error) {
    console.error("❌ Error interno al resumir:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;