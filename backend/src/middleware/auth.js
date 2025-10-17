// src/middleware/auth.js

// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "No autorizado: Debes iniciar sesión." });
}

// Middleware para verificar si el usuario es un docente
function isTeacher(req, res, next) {
  if (req.user && req.user.rol === "docente") {
    return next();
  }
  res
    .status(403)
    .json({ message: "Prohibido: Esta acción solo es para docentes." });
}

module.exports = {
  isAuthenticated,
  isTeacher,
};
