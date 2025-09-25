const express = require("express");
const { requireAuth } = require("./authMiddleware");
const sgMail = require("@sendgrid/mail");

const router = express.Router();

// Configurar SendGrid con la API Key de tu .env
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Proteger la ruta con requireAuth
router.post("/send", requireAuth, async (req, res) => {
  const { email, event } = req.body;

  if (!email || !event) {
    return res.status(400).json({ error: "Faltan parámetros: email y evento" });
  }

  try {
    await sgMail.send({
      to: email,
      from: "seconmindmail@gmail.com", // 👈 Usa aquí el mismo correo verificado en SendGrid
      subject: `⏰ Recordatorio: ${event.title}`,
      html: `
      <body style="margin:0;padding:0;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #f0f8ff, #dce6ff, #fadcf0); padding:40px;">
        <div style="max-width:500px;margin:0 auto;background:rgba(255,255,255,0.6);backdrop-filter:blur(10px);border-radius:30px;padding:30px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.15);">
          
          <h1 style="font-size:28px;color:#2f81d9;margin:0 0 10px;">Second<span style="color:#4781c6;">Mind</span></h1>
          <p style="font-size:16px;color:#333;margin:0 0 20px;">Organiza. Enfócate. Avanza 🚀</p>
          
          <p style="font-size:18px;color:#444;margin-bottom:20px;">Tienes un evento pendiente:</p>

          <p style="font-size:18px;color:#2f81d9;margin-bottom:10px;">
            📌 ${event.title}
          </p>

          <p style="font-size:15px;color:#444;margin-bottom:20px;">
            📅 ${new Date(event.endDate).toLocaleString("es-ES", {
              dateStyle: "full",
              timeStyle: "short",
            })}
          </p>

          ${
            event.address
              ? `<p style="font-size:15px;color:#666;margin-bottom:20px;">📍 ${event.address}</p>`
              : ""
          }

          ${
            event.descriptionEvent
              ? `<p style="font-size:14px;color:#555;margin-bottom:20px;">${event.descriptionEvent}</p>`
              : ""
          }
          
          <hr style="margin:30px 0;border:none;border-top:1px solid rgba(0,0,0,0.1);" />
          
          <p style="font-size:12px;color:#999;">© 2025 SecondMind ✨</p>
        </div>
      </body>
      `,
    });

    console.log("✅ Email enviado con SendGrid");
    res.json({ message: "✅ Recordatorio enviado correctamente" });
  } catch (err) {
    console.error("❌ Error en /reminder/send:", err);

    if (err.response && err.response.body) {
      console.error("📩 Detalle de SendGrid:", JSON.stringify(err.response.body, null, 2));
    }

    res.status(500).json({ error: "Error al enviar el recordatorio" });
  }
});

module.exports = router;