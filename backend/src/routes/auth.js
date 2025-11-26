const express = require("express");
const passport = require("passport");
const router = express.Router();

// --- RUTAS DE GOOGLE ---

// GET /api/auth/google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// GET /api/auth/google/callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login?error=google_failed",
    successRedirect: "http://localhost:5173", // Vuelve al Dashboard
  })
);

// --- RUTAS LOCALES (NUEVO) ---

// POST /api/auth/login (Para admin o usuarios manuales)
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);

    if (!user) {
      // Si falla (usuario no existe o pass incorrecto), devolvemos 401 y el mensaje
      return res
        .status(401)
        .json({ message: info.message || "Error de autenticación" });
    }

    // Si es exitoso, iniciamos la sesión manualmente en req
    req.logIn(user, (err) => {
      if (err) return next(err);

      // Devolvemos el usuario (sin el hash de la contraseña por seguridad)
      const userResponse = { ...user };
      delete userResponse.password_hash;

      return res.json({ message: "Login exitoso", user: userResponse });
    });
  })(req, res, next);
});

// --- RUTAS DE SESIÓN ---

// GET /api/auth/profile (Verificar sesión activa)
router.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "No estás autenticado" });
  }
  res.json(req.user);
});

// GET /api/auth/logout
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("http://localhost:5173/login"); // Redirigir al login del frontend
  });
});

module.exports = router;
