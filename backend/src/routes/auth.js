const express = require("express");
const passport = require("passport");
const router = express.Router();

// Ruta inicial: redirige al usuario a la pantalla de login de Google
// GET /api/auth/google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Ruta de callback: Google redirige aquí después del login
// GET /api/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login-failed",
    // --- LÍNEA CORREGIDA ---
    // En lugar de ir a la API, volvemos a la raíz de la aplicación frontend.
    successRedirect: "http://localhost:5173",
  })
);

// Ruta protegida para ver el perfil del usuario actual (usada por el frontend)
// GET /api/auth/profile
router.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "No estás autenticado" });
  }
  res.json(req.user);
});

// Ruta para cerrar sesión
// GET /api/auth/logout
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    // Al cerrar sesión, también volvemos a la raíz del frontend.
    res.redirect("http://localhost:5173");
  });
});

module.exports = router;
