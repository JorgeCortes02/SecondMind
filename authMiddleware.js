// authMiddleware.js
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Falta cabecera Authorization" });
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Formato de token inválido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { userId, email, iat, exp }
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

module.exports = { requireAuth };