const express = require("express");
const db = require("../db");
const { isAuthenticated, isTeacher } = require("../middleware/auth");
const multer = require("multer");
const { bucket } = require("../firebase-config");
const { v4: uuidv4 } = require("uuid");
const xlsx = require("xlsx");

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
      SELECT e.id, e.nombre_evaluacion, e.fecha_fin, c.nombre_clase, ent.fecha_entrega,
      cal.nota 
      FROM Evaluaciones e
      JOIN Clases c ON e.clase_id = c.id
      JOIN Inscripciones i ON i.clase_id = c.id
      JOIN Entregas ent ON ent.evaluacion_id = e.id
      LEFT JOIN Calificaciones cal ON cal.entrega_id = ent.id
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

// --- (NUEVO) 4.5 Ruta para CALENDARIO GLOBAL (Feature 13) ---
// --- (MODIFICADO) 4.5 Ruta para CALENDARIO GLOBAL + HORARIOS DE CLASE ---
router.get("/calendario", isAuthenticated, async (req, res) => {
  const usuario_id = req.user.id;
  try {
    // 1. Obtener Evaluaciones (Eventos Únicos)
    const evaluacionesQuery = await db.query(
      `
      SELECT 
        e.id, 
        e.nombre_evaluacion, 
        e.fecha_fin, 
        c.nombre_clase,
        CASE WHEN ent.id IS NOT NULL THEN true ELSE false END as entregado
      FROM Evaluaciones e
      JOIN Clases c ON e.clase_id = c.id
      JOIN Inscripciones i ON i.clase_id = c.id
      LEFT JOIN Entregas ent ON e.id = ent.evaluacion_id AND ent.usuario_id = $1
      WHERE i.usuario_id = $1
      ORDER BY e.fecha_fin ASC;
    `,
      [usuario_id]
    );

    // 2. Obtener Horarios de Clases (Eventos Recurrentes)
    const clasesQuery = await db.query(
      `
      SELECT 
        c.id,
        c.nombre_clase,
        c.dias,        -- Ej: "Lunes, Miércoles"
        c.hora_inicio, -- Ej: "08:00:00"
        c.hora_fin     -- Ej: "10:00:00"
      FROM Clases c
      JOIN Inscripciones i ON c.id = i.clase_id
      WHERE i.usuario_id = $1
    `,
      [usuario_id]
    );

    // Devolvemos ambos objetos
    res.json({
      evaluaciones: evaluacionesQuery.rows,
      clases: clasesQuery.rows,
    });
  } catch (error) {
    console.error("Error al obtener datos del calendario:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
// --- 5. Ruta para que el ESTUDIANTE revise su ENTREGA ---
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

    let archivosConUrlSegura = [];
    if (archivosQuery.rows.length > 0) {
      const options = {
        version: "v4",
        action: "read",
        expires: Date.now() + 15 * 60 * 1000,
      };
      archivosConUrlSegura = await Promise.all(
        archivosQuery.rows.map(async (archivo) => {
          const [signedUrl] = await bucket
            .file(archivo.ruta_archivo)
            .getSignedUrl(options);
          return {
            ...archivo,
            archivo_url: signedUrl,
          };
        })
      );
    }

    const respuestasQuery = await db.query(
      "SELECT criterio_id, nivel_id FROM Respuestas_Rubrica WHERE entrega_id = $1",
      [entrega_id]
    );
    const respuestas = respuestasQuery.rows.reduce((acc, r) => {
      acc[r.criterio_id] = r.nivel_id;
      return acc;
    }, {});

    const calificacionQuery = await db.query(
      "SELECT * FROM Calificaciones WHERE entrega_id = $1",
      [entrega_id]
    );
    const calificacion =
      calificacionQuery.rows.length > 0 ? calificacionQuery.rows[0] : null;

    let detalleDocente = {};
    if (calificacion) {
      const detalleQuery = await db.query(
        "SELECT criterio_id, nivel_id FROM Detalle_Calificacion WHERE calificacion_id = $1",
        [calificacion.id]
      );
      detalleDocente = detalleQuery.rows.reduce((acc, r) => {
        acc[r.criterio_id] = r.nivel_id;
        return acc;
      }, {});
    }

    res.json({
      entrega: entrega,
      archivos: archivosConUrlSegura,
      respuestas: respuestas,
      calificacion: calificacion,
      detalleDocente: detalleDocente,
    });
  } catch (error) {
    console.error("Error al obtener la entrega:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- 6. Ruta para que el ESTUDIANTE vea UNA evaluación ---
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

// --- 7. Ruta para ENTREGAR evaluación ---
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

// --- 8. Ruta para que el DOCENTE vea las entregas (CORREGIDA CON ARCHIVOS) ---
router.get(
  "/:id/entregas_docente",
  [isAuthenticated, isTeacher],
  async (req, res) => {
    const { id: evaluacion_id } = req.params;

    try {
      // Obtenemos alumnos + datos de entrega + archivo (solo el primero si hay varios)
      const entregasQuery = await db.query(
        `SELECT 
          u.id AS usuario_id, 
          u.nombre_completo AS nombre_estudiante,
          u.email AS email_estudiante,
          e.id AS entrega_id,
          e.fecha_entrega,
          e.enlace_url, -- Para entregas tipo enlace
          ae.ruta_archivo, -- Para entregas tipo archivo
          c.id AS calificacion_id,
          c.nota
        FROM 
          Usuarios u
        JOIN 
          Inscripciones i ON u.id = i.usuario_id
        LEFT JOIN 
          Entregas e ON e.usuario_id = u.id AND e.evaluacion_id = $1
        LEFT JOIN 
          Archivos_Entrega ae ON ae.entrega_id = e.id
        LEFT JOIN 
          Calificaciones c ON c.entrega_id = e.id
        WHERE 
          i.clase_id = (SELECT clase_id FROM Evaluaciones WHERE id = $1) 
          AND u.rol = 'estudiante'
        ORDER BY 
          u.nombre_completo ASC`,
        [evaluacion_id]
      );

      // Procesar URLs firmadas de Firebase
      const filasConUrl = await Promise.all(
        entregasQuery.rows.map(async (row) => {
          let urlFinal = null;

          // Caso 1: Es un archivo en Firebase
          if (row.ruta_archivo) {
            const options = {
              version: "v4",
              action: "read",
              expires: Date.now() + 60 * 60 * 1000, // 1 hora
            };
            const [signedUrl] = await bucket
              .file(row.ruta_archivo)
              .getSignedUrl(options);
            urlFinal = signedUrl;
          }
          // Caso 2: Es un enlace externo (Drive, Github, etc)
          else if (row.enlace_url) {
            urlFinal = row.enlace_url;
          }

          return {
            ...row,
            url_para_ver: urlFinal, // Campo unificado para el frontend
          };
        })
      );

      res.json(filasConUrl);
    } catch (error) {
      console.error("Error al obtener las entregas:", error);
      res.status(500).json({ message: "Error interno." });
    }
  }
);

// --- 9. Ruta para que el DOCENTE califique ---
router.post(
  "/:entregaId/calificar",
  [isAuthenticated, isTeacher],
  async (req, res) => {
    const { entregaId } = req.params;
    const { feedback, detalles, nota } = req.body;
    const docente_id = req.user.id;

    try {
      await db.query("BEGIN");

      const existingCalificacion = await db.query(
        "SELECT id FROM Calificaciones WHERE entrega_id = $1",
        [entregaId]
      );

      let calificacion_id;

      if (existingCalificacion.rows.length > 0) {
        calificacion_id = existingCalificacion.rows[0].id;
        await db.query(
          "UPDATE Calificaciones SET feedback = $1, nota = $2, fecha_calificacion = NOW() WHERE id = $3",
          [feedback, nota, calificacion_id]
        );
        await db.query(
          "DELETE FROM Detalle_Calificacion WHERE calificacion_id = $1",
          [calificacion_id]
        );
      } else {
        const calificacionResult = await db.query(
          `INSERT INTO Calificaciones (entrega_id, docente_id, feedback, nota) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
          [entregaId, docente_id, feedback, nota]
        );
        calificacion_id = calificacionResult.rows[0].id;
      }

      for (const [criterioId, nivelId] of Object.entries(detalles)) {
        await db.query(
          `INSERT INTO Detalle_Calificacion (calificacion_id, criterio_id, nivel_id) 
          VALUES ($1, $2, $3)`,
          [calificacion_id, criterioId, nivelId]
        );
      }

      await db.query("COMMIT");
      res.status(201).json({ message: "Calificación guardada con éxito." });
    } catch (error) {
      await db.query("ROLLBACK");
      console.error("Error al calificar:", error);
      res
        .status(500)
        .json({ message: "Error interno al guardar la calificación." });
    }
  }
);

// --- 10. Ruta para ver detalles de entrega ---
router.get(
  "/entregas/:entregaId/detalles",
  [isAuthenticated, isTeacher],
  async (req, res) => {
    const { entregaId } = req.params;
    try {
      const archivosQuery = await db.query(
        "SELECT * FROM Archivos_Entrega WHERE entrega_id = $1",
        [entregaId]
      );

      let archivosConUrl = [];
      if (archivosQuery.rows.length > 0) {
        const options = {
          version: "v4",
          action: "read",
          expires: Date.now() + 15 * 60 * 1000,
        };
        archivosConUrl = await Promise.all(
          archivosQuery.rows.map(async (archivo) => {
            const [signedUrl] = await bucket
              .file(archivo.ruta_archivo)
              .getSignedUrl(options);
            return {
              ...archivo,
              archivo_url: signedUrl,
            };
          })
        );
      }

      const calificacionQuery = await db.query(
        "SELECT * FROM Calificaciones WHERE entrega_id = $1",
        [entregaId]
      );

      let calificacion = null;
      let detallesCalificacion = {};

      if (calificacionQuery.rows.length > 0) {
        calificacion = calificacionQuery.rows[0];
        const detallesQuery = await db.query(
          "SELECT criterio_id, nivel_id FROM Detalle_Calificacion WHERE calificacion_id = $1",
          [calificacion.id]
        );
        detallesQuery.rows.forEach((row) => {
          detallesCalificacion[row.criterio_id] = row.nivel_id;
        });
      }

      res.json({
        archivos: archivosConUrl,
        calificacion: calificacion,
        detalles: detallesCalificacion,
      });
    } catch (error) {
      console.error("Error al obtener detalles de entrega:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }
);

// --- 11. Ruta para EXPORTAR notas ---
router.get("/:id/exportar", [isAuthenticated, isTeacher], async (req, res) => {
  const { id: evaluacion_id } = req.params;

  try {
    const evalResult = await db.query(
      "SELECT nombre_evaluacion FROM Evaluaciones WHERE id = $1",
      [evaluacion_id]
    );
    if (evalResult.rows.length === 0)
      return res.status(404).send("Evaluación no encontrada");
    const nombreEvaluacion = evalResult.rows[0].nombre_evaluacion;

    const reporteQuery = await db.query(
      `SELECT 
          u.nombre_completo as "Estudiante",
          u.email as "Correo",
          CASE WHEN e.id IS NOT NULL THEN 'Entregado' ELSE 'Pendiente' END as "Estado",
          TO_CHAR(e.fecha_entrega, 'YYYY-MM-DD HH24:MI') as "Fecha Entrega",
          c.nota as "Nota Final",
          c.feedback as "Comentarios"
        FROM Inscripciones i
        JOIN Usuarios u ON i.usuario_id = u.id
        JOIN Evaluaciones ev ON ev.id = $1
        LEFT JOIN Entregas e ON e.usuario_id = u.id AND e.evaluacion_id = $1
        LEFT JOIN Calificaciones c ON c.entrega_id = e.id
        WHERE i.clase_id = ev.clase_id
        ORDER BY u.nombre_completo ASC`,
      [evaluacion_id]
    );

    const datos = reporteQuery.rows;
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(datos);
    const wscols = [
      { wch: 30 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 10 },
      { wch: 50 },
    ];
    worksheet["!cols"] = wscols;
    xlsx.utils.book_append_sheet(workbook, worksheet, "Resultados");
    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Notas-${nombreEvaluacion}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error al exportar notas:", error);
    res.status(500).send("Error al generar el reporte.");
  }
});

// --- 12. (NUEVA RUTA) Obtener evaluaciones por CLASE ---
router.get("/clase/:claseId", isAuthenticated, async (req, res) => {
  const { claseId } = req.params;
  const usuario_id = req.user.id;

  try {
    const query = `
            SELECT 
                e.id, e.nombre_evaluacion, e.fecha_fin, e.tipo_evaluacion,
                ent.id as entrega_id, ent.fecha_entrega,
                cal.nota
            FROM Evaluaciones e
            LEFT JOIN Entregas ent ON e.id = ent.evaluacion_id AND ent.usuario_id = $1
            LEFT JOIN Calificaciones cal ON ent.id = cal.entrega_id
            WHERE e.clase_id = $2
            ORDER BY e.fecha_creacion DESC
        `;
    const result = await db.query(query, [usuario_id, claseId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener evaluaciones de la clase:", error);
    res.status(500).json({ message: "Error interno." });
  }
});
// --- RUTA PARA ELIMINAR EVALUACIÓN ---
router.delete("/:id", [isAuthenticated, isTeacher], async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Verificar Integridad: ¿Hay entregas de alumnos?
    const entregasQuery = await db.query(
      "SELECT id FROM Entregas WHERE evaluacion_id = $1",
      [id]
    );

    if (entregasQuery.rows.length > 0) {
      return res.status(400).json({
        message:
          "No se puede eliminar: Hay alumnos que ya enviaron tareas en esta evaluación.",
      });
    }

    // 2. Si está limpio, procedemos a borrar
    await db.query("DELETE FROM Evaluaciones WHERE id = $1", [id]);

    res.json({ message: "Evaluación eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar evaluación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- RUTA PARA EDITAR EVALUACIÓN (PUT) ---
router.put("/:id", [isAuthenticated, isTeacher], async (req, res) => {
  const { id } = req.params;
  const { nombre_evaluacion, fecha_fin, tipo_entrega } = req.body;

  // Nota: Por seguridad, en este MVP no permitimos cambiar la rúbrica ni la clase una vez creada
  // para no romper la integridad de datos si ya hay notas.

  try {
    const updateQuery = await db.query(
      `UPDATE Evaluaciones 
       SET nombre_evaluacion = $1, fecha_fin = $2, tipo_entrega = $3
       WHERE id = $4 RETURNING *`,
      [nombre_evaluacion, fecha_fin, tipo_entrega, id]
    );

    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ message: "Evaluación no encontrada." });
    }

    res.json(updateQuery.rows[0]);
  } catch (error) {
    console.error("Error al actualizar evaluación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});
module.exports = router;
