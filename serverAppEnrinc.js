const express = require("express");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const router = express.Router();

// Ruta para obtener una cita aleatoria
router.get("/", async (req, res) => {
  try {
    const response = await fetch("https://api.quotable.io/random");
    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: "Error al obtener cita" });
    }

    res.json({
      quote: data.content,
      author: data.author
    });
  } catch (error) {
    console.error("❌ Error al obtener cita:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;