const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
// Importación correcta del middleware
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Protegemos todas las rutas: Solo ADMIN
router.use(isAuthenticated, isAdmin);

// 1. OBTENER TODOS LOS USUARIOS
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, google_id, nombre_completo, email, rol, foto_url, activo, fecha_creacion
       FROM Usuarios
       ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error interno." });
  }
});

// 2. CREAR NUEVO USUARIO
router.post("/", async (req, res) => {
  const { nombre_completo, email, password, rol } = req.body;

  if (!email || !password || !nombre_completo || !rol) {
    return res.status(400).json({ message: "Faltan campos obligatorios." });
  }

  try {
    const existingUser = await db.query(
      "SELECT id FROM Usuarios WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "El correo ya está registrado." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      `INSERT INTO Usuarios (nombre_completo, email, password_hash, rol, activo) 
       VALUES ($1, $2, $3, $4, TRUE) RETURNING id, nombre_completo, email, rol, activo`,
      [nombre_completo, email, passwordHash, rol]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ message: "Error interno." });
  }
});

// 3. ACTUALIZAR USUARIO COMPLETO
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, email, rol, activo } = req.body;

  try {
    // Usamos COALESCE para mantener el valor actual si no enviamos uno nuevo
    const userQuery = await db.query(
      `UPDATE Usuarios 
       SET nombre_completo = COALESCE($1, nombre_completo),
           email = COALESCE($2, email),
           rol = COALESCE($3, rol), 
           activo = COALESCE($4, activo)
       WHERE id = $5 
       RETURNING id, nombre_completo, email, rol, activo`,
      [nombre_completo, email, rol, activo, id]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.json(userQuery.rows[0]);
  } catch (error) {
    console.error("Error al actualizar:", error);
    // Manejo de error si el email ya existe en otro usuario
    if (error.code === "23505") {
      return res.status(409).json({ message: "Ese email ya está en uso." });
    }
    res.status(500).json({ message: "Error interno." });
  }
});

module.exports = router; // 👈 ¡Crucial!
