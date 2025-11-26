function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Acceso denegado. No autenticado." });
}

function isTeacher(req, res, next) {
  if (req.isAuthenticated() && req.user.rol === "docente") {
    return next();
  }
  res.status(403).json({ message: "Acceso denegado. Solo para docentes." });
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.rol === "admin") {
    return next();
  }
  res
    .status(403)
    .json({ message: "Acceso denegado. Solo para administradores." });
}

module.exports = {
  isAuthenticated,
  isTeacher,
  isAdmin, // 👈 ¡Verifica que esta línea exista!
};
