// --- IMPORTS ---
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const db = require("./db");
const rubricaRoutes = require("./routes/rubricas");
const evaluacionRoutes = require("./routes/evaluaciones");
const moduloRoutes = require("./routes/modulos");
const recursoRoutes = require("./routes/recursos"); // <--- IMPORTA EL NUEVO
const usuarioRoutes = require("./routes/usuarios"); // <-- NUEVO IMPORT
const dashboardRoutes = require("./routes/dashboard"); // <--- IMPORTA ESTO
// Run Passport configuration
require("./passport-config");

// Import route handlers
const authRoutes = require("./routes/auth");
const claseRoutes = require("./routes/clases");

// --- INITIALIZATION & MIDDLEWARE ---
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS in production
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// --- ROUTES ---
// Connect the imported routers to the app
app.use("/api/auth", authRoutes);
app.use("/api/clases", claseRoutes);
app.use("/api/rubricas", rubricaRoutes);
app.use("/api/evaluaciones", evaluacionRoutes);
app.use("/api/modulos", moduloRoutes);
app.use("/api/recursos", recursoRoutes); // <--- ACTIVA LA RUTA
app.use("/api/anuncios", require("./routes/anuncios"));
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/dashboard", dashboardRoutes); // <--- AGREGA ESTA LÍNEA
// Root route for a simple server status check
app.get("/", (req, res) => {
  res.send(
    'Server is running. <a href="/api/auth/google">Login with Google</a>'
  );
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Verify database connection on startup
  db.query("SELECT NOW()")
    .then(() => console.log("✅ Database connection successful."))
    .catch((err) => console.error("❌ Database connection error:", err));
});
