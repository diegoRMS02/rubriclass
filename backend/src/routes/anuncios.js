const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated, isTeacher } = require("../middleware/auth");

// 1. OBTENER ANUNCIOS DE UNA CLASE
router.get("/clase/:claseId", isAuthenticated, async (req, res) => {
  const { claseId } = req.params;
  try {
    // Hacemos JOIN con Usuarios para mostrar foto y nombre del profe
    const query = `
      SELECT a.*, u.nombre_completo, u.foto_url
      FROM Anuncios a
      JOIN Usuarios u ON a.usuario_id = u.id
      WHERE a.clase_id = $1
      ORDER BY a.fecha_creacion DESC
    `;
    const result = await db.query(query, [claseId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener anuncios:", error);
    res.status(500).json({ message: "Error interno." });
  }
});

// 2. PUBLICAR ANUNCIO (Solo Docente)
router.post("/", [isAuthenticated, isTeacher], async (req, res) => {
  const { clase_id, contenido } = req.body;
  const usuario_id = req.user.id;

  if (!contenido)
    return res
      .status(400)
      .json({ message: "El contenido no puede estar vacío" });

  try {
    const result = await db.query(
      "INSERT INTO Anuncios (clase_id, usuario_id, contenido) VALUES ($1, $2, $3) RETURNING *",
      [clase_id, usuario_id, contenido]
    );

    // Devolvemos el anuncio recién creado enriquecido con datos del usuario actual (para el frontend)
    const nuevoAnuncio = {
      ...result.rows[0],
      nombre_completo: req.user.nombre_completo,
      foto_url: req.user.foto_url,
    };

    res.status(201).json(nuevoAnuncio);
  } catch (error) {
    console.error("Error al publicar anuncio:", error);
    res.status(500).json({ message: "Error interno." });
  }
});

// 3. ELIMINAR ANUNCIO (Solo Docente)
router.delete("/:id", [isAuthenticated, isTeacher], async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM Anuncios WHERE id = $1", [id]);
    res.json({ message: "Anuncio eliminado" });
  } catch (error) {
    console.error("Error borrando anuncio:", error);
    res.status(500).json({ message: "Error interno." });
  }
});

module.exports = router;
