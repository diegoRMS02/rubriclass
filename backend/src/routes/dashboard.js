const express = require("express");
const router = express.Router();
const db = require("../db"); // Asegúrate que esta ruta a tu db.js sea correcta
const { isAuthenticated, isAdmin } = require("../middleware/auth"); // Ajusta la ruta a tu middleware

// Ruta: GET /api/dashboard/stats
// Desc: Obtener contadores para el panel de administración
router.get("/stats", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Ejecutamos las 3 consultas en paralelo para mayor velocidad
    const [usersResult, classesResult, evaluationsResult] = await Promise.all([
      db.query("SELECT COUNT(*) FROM Usuarios"),
      db.query("SELECT COUNT(*) FROM Clases"),
      // Si tu tabla de tareas se llama 'evaluaciones', usa esta.
      // Si se llama 'entregas' o 'tareas', cambia el nombre de la tabla aquí.
      db.query("SELECT COUNT(*) FROM Evaluaciones"),
    ]);

    const stats = {
      usuarios: parseInt(usersResult.rows[0].count),
      clases: parseInt(classesResult.rows[0].count),
      evaluaciones: parseInt(evaluationsResult.rows[0].count),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    res.status(500).json({ message: "Error al cargar estadísticas." });
  }
});

module.exports = router;
