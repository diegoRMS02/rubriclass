require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");

// Importar la configuración de Passport que acabamos de crear
require("./passport-config");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
// 1. Configuración de la sesión
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Poner en 'true' si usas HTTPS
  })
);

// 2. Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// --- Rutas de Autenticación ---
// Ruta inicial: redirige al usuario a la pantalla de login de Google
app.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Ruta de callback: Google redirige aquí después del login
app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login-failed", // Ruta a la que redirigir si falla
    successRedirect: "/api/auth/profile", // Ruta a la que redirigir si tiene éxito
  })
);

// Ruta protegida para ver el perfil del usuario (prueba)
app.get("/api/auth/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("No estás autenticado");
  }
  res.json(req.user);
});

// Ruta para cerrar sesión
app.get("/api/auth/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/"); // Redirigir a la página principal
  });
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send(
    'Servidor funcionando. <a href="/api/auth/google">Iniciar sesión con Google</a>'
  );
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
});
