const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const db = require("../db");
const { isAuthenticated, isTeacher } = require("../middleware/auth");

const router = express.Router();

// Configuración de Multer para manejar la subida de archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });
router.get("/", [isAuthenticated, isTeacher], async (req, res) => {
  const docente_id = req.user.id;

  try {
    const rubricasQuery = await db.query(
      "SELECT id, titulo, descripcion FROM Rubricas WHERE docente_id = $1 ORDER BY fecha_creacion DESC",
      [docente_id]
    );
    res.json(rubricasQuery.rows);
  } catch (error) {
    console.error("Error al obtener las rúbricas:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
// POST /api/rubricas/upload
router.post(
  "/upload",
  [isAuthenticated, isTeacher, upload.single("rubricaFile")],
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se ha subido ningún archivo." });
    }

    const docente_id = req.user.id;

    try {
      // Leer el archivo Excel desde el buffer de memoria
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      // --- Procesamiento de la Rúbrica ---
      const titulo = data[0][1]; // Celda B1
      const descripcion = data[1][1]; // Celda B2
      const niveles = data[3].slice(1); // Fila 4, desde la columna B en adelante
      const puntajes = data[4].slice(1); // Fila 5, desde la columna B en adelante
      const criterios = data.slice(5); // Desde la fila 6 hacia abajo

      // Iniciar una transacción para asegurar que todo se guarde correctamente
      await db.query("BEGIN");

      // 1. Insertar la Rúbrica
      const rubricaResult = await db.query(
        "INSERT INTO Rubricas (titulo, descripcion, docente_id) VALUES ($1, $2, $3) RETURNING id",
        [titulo, descripcion, docente_id]
      );
      const rubricaId = rubricaResult.rows[0].id;

      // 2. Insertar los Criterios y sus Niveles
      for (let i = 0; i < criterios.length; i++) {
        const criterioDesc = criterios[i][0]; // Columna A
        const criterioResult = await db.query(
          "INSERT INTO Criterios (rubrica_id, descripcion, orden) VALUES ($1, $2, $3) RETURNING id",
          [rubricaId, criterioDesc, i]
        );
        const criterioId = criterioResult.rows[0].id;

        for (let j = 0; j < niveles.length; j++) {
          const nivelDesc = niveles[j];
          const nivelPuntaje = puntajes[j];
          await db.query(
            "INSERT INTO Niveles (criterio_id, descripcion, puntaje, orden) VALUES ($1, $2, $3, $4)",
            [criterioId, nivelDesc, nivelPuntaje, j]
          );
        }
      }

      // Si todo fue exitoso, confirmar la transacción
      await db.query("COMMIT");

      res
        .status(201)
        .json({ message: "Rúbrica subida y procesada con éxito." });
    } catch (error) {
      // Si algo falla, revertir todos los cambios
      await db.query("ROLLBACK");
      console.error("Error al procesar la rúbrica:", error);
      res
        .status(500)
        .json({ message: "Error interno al procesar el archivo." });
    }
  }
);
// --- RUTA PARA ELIMINAR RÚBRICA ---
router.delete("/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;

  try {
    // Validamos si la rúbrica ya se usó en una evaluación (Integridad Referencial)
    const usoQuery = await db.query(
      "SELECT id FROM Evaluaciones WHERE rubrica_id = $1",
      [id]
    );

    if (usoQuery.rows.length > 0) {
      return res.status(400).json({
        message:
          "No se puede eliminar: Esta rúbrica está siendo usada en evaluaciones activas.",
      });
    }

    await db.query("DELETE FROM Criterios WHERE rubrica_id = $1", [id]); // Borramos hijos primero (si no tienes ON DELETE CASCADE)
    await db.query("DELETE FROM Rubricas WHERE id = $1", [id]); // Borramos padre

    res.json({ message: "Rúbrica eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar rúbrica:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
module.exports = router;
