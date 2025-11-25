const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated, isTeacher } = require("../middleware/auth");
const multer = require("multer");
const { bucket } = require("../firebase-config");
const { v4: uuidv4 } = require("uuid");

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/recursos (Esta es la ruta que llama tu Frontend)
router.post(
  "/",
  [isAuthenticated, isTeacher, upload.single("archivo")],
  async (req, res) => {
    const { modulo_id, tipo } = req.body; // El ID viene en el body gracias a FormData
    const archivo = req.file;

    if (!modulo_id) {
      return res.status(400).json({ message: "Falta el ID del módulo." });
    }

    try {
      // Opción A: Es un archivo
      if (tipo === "archivo" && archivo) {
        const nombreUnico = `${uuidv4()}-${archivo.originalname}`;
        const rutaFirebase = `recursos/${nombreUnico}`;
        const fileUpload = bucket.file(rutaFirebase);

        const blobStream = fileUpload.createWriteStream({
          metadata: { contentType: archivo.mimetype },
        });

        blobStream.on("error", (err) =>
          res.status(500).json({ message: "Error subiendo a nube." })
        );

        blobStream.on("finish", async () => {
          await db.query(
            "INSERT INTO Recursos (modulo_id, titulo, url, tipo) VALUES ($1, $2, $3, $4)",
            [modulo_id, archivo.originalname, rutaFirebase, "archivo"]
          );
          res.status(201).json({ message: "Archivo guardado" });
        });

        blobStream.end(archivo.buffer);
      }
      // Opción B: Futuro soporte para enlaces u otros tipos
      else {
        return res
          .status(400)
          .json({ message: "Tipo de recurso no soportado o falta archivo." });
      }
    } catch (error) {
      console.error("Error en recursos:", error);
      res.status(500).json({ message: "Error interno." });
    }
  }
);

// DELETE /api/recursos/:id (Eliminar recurso)
router.delete("/:id", [isAuthenticated, isTeacher], async (req, res) => {
  const { id } = req.params;
  try {
    // Aquí podrías agregar lógica para borrar de Firebase también
    await db.query("DELETE FROM Recursos WHERE id = $1", [id]);
    res.json({ message: "Recurso eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar" });
  }
});

module.exports = router;
