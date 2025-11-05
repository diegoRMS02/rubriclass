const express = require("express");
const db = require("../db");
const { isAuthenticated, isTeacher } = require("../middleware/auth");
const multer = require("multer");
const { bucket } = require("../firebase-config");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- 1. Ruta para OBTENER las evaluaciones de un docente ---
router.get("/", [isAuthenticated, isTeacher], async (req, res) => {
  const docente_id = req.user.id;
  try {
    const evaluacionesQuery = await db.query(
      `SELECT 
         e.id, e.nombre_evaluacion, e.tipo_evaluacion, e.fecha_fin, e.tipo_entrega,
         c.nombre_clase, r.titulo as nombre_rubrica
       FROM Evaluaciones e
       JOIN Clases c ON e.clase_id = c.id
       JOIN Rubricas r ON e.rubrica_id = r.id
       WHERE c.docente_id = $1 
       ORDER BY e.fecha_creacion DESC`,
      [docente_id]
    );
    res.json(evaluacionesQuery.rows);
  } catch (error) {
    console.error("Error al obtener las evaluaciones:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- 2. Ruta para CREAR una nueva evaluación ---
router.post("/", [isAuthenticated, isTeacher], async (req, res) => {
  const {
    nombre_evaluacion,
    clase_id,
    rubrica_id,
    tipo_evaluacion,
    fecha_fin,
    tipo_entrega,
  } = req.body;

  if (
    !nombre_evaluacion ||
    !clase_id ||
    !rubrica_id ||
    !tipo_evaluacion ||
    !tipo_entrega
  ) {
    return res
      .status(400)
      .json({ message: "Faltan datos para crear la evaluación." });
  }
  const fechaFinSQL = fecha_fin ? new Date(fecha_fin) : null;

  try {
    const nuevaEvaluacion = await db.query(
      `INSERT INTO Evaluaciones (
         nombre_evaluacion, clase_id, rubrica_id, tipo_evaluacion, fecha_fin, tipo_entrega
       ) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        nombre_evaluacion,
        clase_id,
        rubrica_id,
        tipo_evaluacion,
        fechaFinSQL,
        tipo_entrega,
      ]
    );
    res.status(201).json(nuevaEvaluacion.rows[0]);
  } catch (error) {
    console.error("Error al crear la evaluación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- 3. Ruta para que el ESTUDIANTE vea sus evaluaciones PENDIENTES ---
router.get("/pendientes", isAuthenticated, async (req, res) => {
  if (req.user.rol !== "estudiante") {
    return res.status(403).json({ message: "Acción solo para estudiantes." });
  }
  const usuario_id = req.user.id;
  try {
    const query = `
      SELECT e.id, e.nombre_evaluacion, e.fecha_fin, c.nombre_clase
      FROM Evaluaciones e
      JOIN Clases c ON e.clase_id = c.id
      JOIN Inscripciones i ON i.clase_id = c.id
      WHERE i.usuario_id = $1
      AND e.id NOT IN (
        SELECT evaluacion_id FROM Entregas WHERE usuario_id = $1
      )
      ORDER BY e.fecha_fin ASC;
    `;
    const pendientesQuery = await db.query(query, [usuario_id]);
    res.json(pendientesQuery.rows);
  } catch (error) {
    console.error("Error al obtener evaluaciones pendientes:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- 4. Ruta para que el ESTUDIANTE vea sus evaluaciones ENTREGADAS ---
router.get("/entregadas", isAuthenticated, async (req, res) => {
  if (req.user.rol !== "estudiante") {
    return res.status(403).json({ message: "Acción solo para estudiantes." });
  }
  const usuario_id = req.user.id;
  try {
    const query = `
      SELECT e.id, e.nombre_evaluacion, e.fecha_fin, c.nombre_clase, ent.fecha_entrega
      FROM Evaluaciones e
      JOIN Clases c ON e.clase_id = c.id
      JOIN Inscripciones i ON i.clase_id = c.id
      JOIN Entregas ent ON ent.evaluacion_id = e.id
      WHERE i.usuario_id = $1 AND ent.usuario_id = $1
      ORDER BY ent.fecha_entrega DESC;
    `;
    const entregadasQuery = await db.query(query, [usuario_id]);
    res.json(entregadasQuery.rows);
  } catch (error) {
    console.error("Error al obtener evaluaciones entregadas:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- 5. (MODIFICADA) Ruta para que el ESTUDIANTE revise su ENTREGA ---
router.get("/:id/entrega", isAuthenticated, async (req, res) => {
  const { id: evaluacion_id_str } = req.params;
  const evaluacion_id = parseInt(evaluacion_id_str, 10);
  const usuario_id = req.user.id;

  if (isNaN(evaluacion_id)) {
    return res.status(400).json({ message: "ID de evaluación inválido." });
  }

  try {
    const entregaQuery = await db.query(
      "SELECT * FROM Entregas WHERE evaluacion_id = $1 AND usuario_id = $2",
      [evaluacion_id, usuario_id]
    );

    if (entregaQuery.rows.length === 0) {
      return res.status(404).json({
        message: "No se ha encontrado una entrega para esta evaluación.",
      });
    }
    const entrega = entregaQuery.rows[0];
    const entrega_id = entrega.id;

    const archivosQuery = await db.query(
      "SELECT * FROM Archivos_Entrega WHERE entrega_id = $1",
      [entrega_id]
    );

    // --- INICIO DE LA MODIFICACIÓN (Generar URL Segura) ---
    let archivosConUrlSegura = [];
    if (archivosQuery.rows.length > 0) {
      // Opciones para la URL firmada: válida por 15 minutos
      const options = {
        version: "v4",
        action: "read",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutos
      };

      // Generamos una URL segura para cada archivo
      archivosConUrlSegura = await Promise.all(
        archivosQuery.rows.map(async (archivo) => {
          // Usamos la 'ruta_archivo' (ej. 'entregas/uuid-archivo.pdf')
          const [signedUrl] = await bucket
            .file(archivo.ruta_archivo)
            .getSignedUrl(options);
          return {
            ...archivo,
            archivo_url: signedUrl, // Reemplazamos la ruta por la URL temporal segura
          };
        })
      );
    }
    // --- FIN DE LA MODIFICACIÓN ---

    const respuestasQuery = await db.query(
      "SELECT criterio_id, nivel_id FROM Respuestas_Rubrica WHERE entrega_id = $1",
      [entrega_id]
    );

    const respuestas = respuestasQuery.rows.reduce((acc, r) => {
      acc[r.criterio_id] = r.nivel_id;
      return acc;
    }, {});

    res.json({
      entrega: entrega,
      archivos: archivosConUrlSegura, // <-- Enviamos los archivos con la URL segura
      respuestas: respuestas,
    });
  } catch (error) {
    console.error("Error al obtener la entrega:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- 6. Ruta para que el ESTUDIANTE vea UNA evaluación (el "examen") ---
router.get("/:id", isAuthenticated, async (req, res) => {
  const { id: idString } = req.params;
  const id = parseInt(idString, 10);
  const { id: usuario_id, rol } = req.user;

  if (isNaN(id)) {
    return res.status(400).json({ message: "ID de evaluación inválido." });
  }

  try {
    let evalQuery;
    if (rol === "docente") {
      evalQuery = await db.query("SELECT * FROM Evaluaciones WHERE id = $1", [
        id,
      ]);
    } else {
      evalQuery = await db.query(
        `SELECT e.* FROM Evaluaciones e
         JOIN Inscripciones i ON i.clase_id = e.clase_id
         WHERE e.id = $1 AND i.usuario_id = $2`,
        [id, usuario_id]
      );
    }

    if (evalQuery.rows.length === 0) {
      return res.status(404).json({
        message: "Evaluación no encontrada o no tienes permiso para verla.",
      });
    }
    const evaluacion = evalQuery.rows[0];
    const criteriosQuery = await db.query(
      "SELECT * FROM Criterios WHERE rubrica_id = $1 ORDER BY orden ASC",
      [evaluacion.rubrica_id]
    );
    const criterios = criteriosQuery.rows;
    const criteriosIds = criterios.map((c) => c.id);
    const nivelesQuery = await db.query(
      "SELECT * FROM Niveles WHERE criterio_id = ANY($1::int[]) ORDER BY orden ASC",
      [criteriosIds]
    );
    const niveles = nivelesQuery.rows;

    const rubricaCompleta = criterios.map((criterio) => ({
      ...criterio,
      niveles: niveles.filter((n) => n.criterio_id === criterio.id),
    }));
    res.json({ evaluacion, rubrica: rubricaCompleta });
  } catch (error) {
    console.error("Error al obtener la evaluación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- 7. (MODIFICADA) Ruta para que el ESTUDIANTE ENTREGUE o MODIFIQUE su tarea ---
router.post(
  "/:id/entregar",
  isAuthenticated,
  upload.single("archivo"),
  async (req, res) => {
    const { id: evaluacion_id_str } = req.params;
    const evaluacion_id = parseInt(evaluacion_id_str, 10);
    const usuario_id = req.user.id;
    const { respuestas, enlace_url } = req.body;
    const archivo = req.file;

    if (isNaN(evaluacion_id)) {
      return res.status(400).json({ message: "ID de evaluación inválido." });
    }

    try {
      const evalQuery = await db.query(
        `SELECT e.fecha_fin, e.tipo_entrega FROM Evaluaciones e
         JOIN Inscripciones i ON i.clase_id = e.clase_id
         WHERE e.id = $1 AND i.usuario_id = $2`,
        [evaluacion_id, usuario_id]
      );
      if (evalQuery.rows.length === 0) {
        return res.status(403).json({
          message: "No tienes permiso para entregar esta evaluación.",
        });
      }
      const evaluacion = evalQuery.rows[0];
      const fechaFin = new Date(evaluacion.fecha_fin);
      if (evaluacion.fecha_fin && new Date() > fechaFin) {
        return res
          .status(403)
          .json({ message: "La fecha límite para esta entrega ha pasado." });
      }

      await db.query("BEGIN");
      const existingEntregaQuery = await db.query(
        "SELECT id FROM Entregas WHERE evaluacion_id = $1 AND usuario_id = $2",
        [evaluacion_id, usuario_id]
      );
      let entrega_id;

      if (existingEntregaQuery.rows.length > 0) {
        entrega_id = existingEntregaQuery.rows[0].id;
        await db.query(
          "UPDATE Entregas SET fecha_entrega = NOW(), enlace_url = $1 WHERE id = $2",
          [evaluacion.tipo_entrega === "enlace" ? enlace_url : null, entrega_id]
        );
        await db.query("DELETE FROM Respuestas_Rubrica WHERE entrega_id = $1", [
          entrega_id,
        ]);
        // --- (MODIFICADO) Borrar solo el registro, NO el archivo de Firebase aún ---
        await db.query("DELETE FROM Archivos_Entrega WHERE entrega_id = $1", [
          entrega_id,
        ]);
      } else {
        const entregaResult = await db.query(
          "INSERT INTO Entregas (evaluacion_id, usuario_id, enlace_url) VALUES ($1, $2, $3) RETURNING id",
          [
            evaluacion_id,
            usuario_id,
            evaluacion.tipo_entrega === "enlace" ? enlace_url : null,
          ]
        );
        entrega_id = entregaResult.rows[0].id;
      }

      if (evaluacion.tipo_entrega === "archivo" && archivo) {
        // --- (MODIFICADO) Guardamos la ruta interna, no la URL pública ---
        const nombreArchivoUnico = `${uuidv4()}-${archivo.originalname}`;
        const rutaArchivoEnFirebase = `entregas/${nombreArchivoUnico}`;
        const fileUpload = bucket.file(rutaArchivoEnFirebase);

        const blobStream = fileUpload.createWriteStream({
          metadata: { contentType: archivo.mimetype },
        });

        blobStream.on("error", (error) => {
          console.error("Error en BlobStream:", error);
          throw new Error("Error al subir el archivo a Firebase");
        });

        await new Promise((resolve, reject) => {
          blobStream.on("finish", async () => {
            try {
              // --- (MODIFICADO) Guardamos la RUTA, no la URL
              await db.query(
                "INSERT INTO Archivos_Entrega (entrega_id, nombre_archivo, ruta_archivo) VALUES ($1, $2, $3)",
                [entrega_id, archivo.originalname, rutaArchivoEnFirebase]
              );
              resolve();
            } catch (dbError) {
              reject(dbError);
            }
          });
          blobStream.end(archivo.buffer);
        });
      }

      if (respuestas) {
        const respuestasObj = JSON.parse(respuestas);
        for (const [criterio_id, nivel_id] of Object.entries(respuestasObj)) {
          await db.query(
            "INSERT INTO Respuestas_Rubrica (entrega_id, criterio_id, nivel_id) VALUES ($1, $2, $3)",
            [entrega_id, criterio_id, nivel_id]
          );
        }
      }

      await db.query("COMMIT");
      res.status(201).json({ message: "Entrega realizada con éxito." });
    } catch (error) {
      await db.query("ROLLBACK");
      console.error("Error al procesar la entrega:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }
);

module.exports = router;
