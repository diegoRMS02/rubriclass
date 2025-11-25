const express = require("express");
const db = require("../db");
const { isAuthenticated, isTeacher } = require("../middleware/auth");
const multer = require("multer");
const { bucket } = require("../firebase-config");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- 1. Crear un nuevo Módulo (ej. "Semana 1") ---
// POST /api/modulos
router.post("/", [isAuthenticated, isTeacher], async (req, res) => {
  const { clase_id, titulo } = req.body;

  if (!clase_id || !titulo) {
    return res.status(400).json({ message: "Faltan datos." });
  }

  try {
    const nuevoModulo = await db.query(
      "INSERT INTO Modulos (clase_id, titulo) VALUES ($1, $2) RETURNING *",
      [clase_id, titulo]
    );
    res.status(201).json(nuevoModulo.rows[0]);
  } catch (error) {
    console.error("Error al crear módulo:", error);
    res.status(500).json({ message: "Error interno." });
  }
});

// --- 2. Subir un RECURSO (Archivo o Enlace) a un módulo ---
// POST /api/modulos/:moduloId/recursos
router.post(
  "/:moduloId/recursos",
  [isAuthenticated, isTeacher, upload.single("archivo")],
  async (req, res) => {
    const { moduloId } = req.params;
    const { titulo, tipo, url_enlace } = req.body; // tipo: 'archivo' o 'enlace'
    const archivo = req.file;

    if (!titulo || !tipo) {
      return res.status(400).json({ message: "Faltan datos del recurso." });
    }

    try {
      // CASO A: Es un ENLACE
      if (tipo === "enlace") {
        await db.query(
          "INSERT INTO Recursos (modulo_id, titulo, tipo, url) VALUES ($1, $2, $3, $4)",
          [moduloId, titulo, "enlace", url_enlace]
        );
        return res.status(201).json({ message: "Enlace guardado con éxito." });
      }

      // CASO B: Es un ARCHIVO
      if (tipo === "archivo" && archivo) {
        const nombreArchivo = `${uuidv4()}-${archivo.originalname}`;
        const rutaInterna = `recursos/${nombreArchivo}`; // Ruta en Firebase
        const fileUpload = bucket.file(rutaInterna);

        const blobStream = fileUpload.createWriteStream({
          metadata: { contentType: archivo.mimetype },
        });

        blobStream.on("error", (error) => {
          console.error(error);
          res.status(500).json({ message: "Error al subir a Firebase." });
        });

        blobStream.on("finish", async () => {
          // Guardamos la ruta interna en la BD (NO la url pública)
          await db.query(
            "INSERT INTO Recursos (modulo_id, titulo, tipo, url) VALUES ($1, $2, $3, $4)",
            [moduloId, titulo, "archivo", rutaInterna]
          );
          res.status(201).json({ message: "Archivo subido con éxito." });
        });

        blobStream.end(archivo.buffer);
      } else {
        res.status(400).json({ message: "Falta el archivo o el enlace." });
      }
    } catch (error) {
      console.error("Error al crear recurso:", error);
      res.status(500).json({ message: "Error interno." });
    }
  }
);

// --- 3. Eliminar un Módulo (y sus recursos en cascada) ---
router.delete("/:id", [isAuthenticated, isTeacher], async (req, res) => {
  const { id } = req.params;
  try {
    // Nota: Por ahora no borramos los archivos de Firebase para simplificar,
    // pero la BD se limpiará gracias al ON DELETE CASCADE.
    await db.query("DELETE FROM Modulos WHERE id = $1", [id]);
    res.json({ message: "Módulo eliminado." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar." });
  }
});
// --- 4. Eliminar un Recurso específico ---
router.delete(
  "/recursos/:id",
  [isAuthenticated, isTeacher],
  async (req, res) => {
    const { id } = req.params;
    try {
      // Opcional: Aquí podríamos borrar también el archivo físico de Firebase para ahorrar espacio
      // const recurso = await db.query('SELECT url FROM Recursos WHERE id = $1', [id]);
      // ... lógica de borrado en firebase ...

      await db.query("DELETE FROM Recursos WHERE id = $1", [id]);
      res.json({ message: "Recurso eliminado." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al eliminar recurso." });
    }
  }
);
module.exports = router;
