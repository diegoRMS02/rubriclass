const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated, isTeacher } = require("../middleware/auth");
const { bucket } = require("../firebase-config");

// --- Función para generar un código de inscripción aleatorio ---
function generateCode() {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// --- RUTAS DOCENTE ---

// GET /api/clases (Listar clases del docente CON CONTEO DE ALUMNOS)
router.get("/", [isAuthenticated, isTeacher], async (req, res) => {
  const { id: docente_id } = req.user;

  try {
    // Consulta optimizada: Cuenta cuántos alumnos hay inscritos en cada clase
    const result = await db.query(
      `SELECT 
          c.id, 
          c.nombre_clase, 
          c.seccion, 
          c.dias, 
          c.hora_inicio, 
          c.hora_fin, 
          c.codigo_inscripcion, 
          COUNT(i.clase_id) AS student_count  -- <--- Campo nuevo
       FROM 
          Clases c
       LEFT JOIN 
          Inscripciones i ON c.id = i.clase_id
       WHERE 
          c.docente_id = $1
       GROUP BY 
          c.id, c.nombre_clase, c.seccion, c.dias, c.hora_inicio, c.hora_fin, c.codigo_inscripcion, c.fecha_creacion
       ORDER BY 
          c.fecha_creacion DESC`, // Usamos fecha_creacion para ordenar
      [docente_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener clases con conteo de alumnos:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// POST /api/clases (Crear clase PROFESIONAL)
router.post("/", [isAuthenticated, isTeacher], async (req, res) => {
  const { nombre_clase, seccion, dias, hora_inicio, hora_fin } = req.body;
  const docente_id = req.user.id;

  if (!nombre_clase) {
    return res
      .status(400)
      .json({ message: "El nombre de la clase es requerido." });
  }

  try {
    const codigo_inscripcion = generateCode();

    // Insertamos los nuevos campos (seccion, dias, horarios)
    const nuevaClaseQuery = await db.query(
      `INSERT INTO Clases (
          nombre_clase, 
          codigo_inscripcion, 
          docente_id,
          seccion,
          dias,
          hora_inicio,
          hora_fin
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        nombre_clase,
        codigo_inscripcion,
        docente_id,
        seccion || "", // Puede ser vacío
        dias || "", // Puede ser vacío
        hora_inicio || null, // Puede ser null
        hora_fin || null, // Puede ser null
      ]
    );

    res.status(201).json(nuevaClaseQuery.rows[0]);
  } catch (error) {
    console.error("Error al crear la clase:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- RUTA PARA EDITAR CLASE (PUT) ---
router.put("/:id", [isAuthenticated, isTeacher], async (req, res) => {
  const { id } = req.params;
  const { nombre_clase, seccion, dias, hora_inicio, hora_fin } = req.body;

  try {
    const updateQuery = await db.query(
      `UPDATE Clases 
       SET nombre_clase = $1, seccion = $2, dias = $3, hora_inicio = $4, hora_fin = $5
       WHERE id = $6 RETURNING *`,
      [nombre_clase, seccion, dias, hora_inicio, hora_fin, id]
    );

    if (updateQuery.rows.length === 0) {
      return res.status(404).json({ message: "Clase no encontrada." });
    }

    res.json(updateQuery.rows[0]);
  } catch (error) {
    console.error("Error al actualizar clase:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- RUTAS ESTUDIANTE ---

// GET /api/clases/inscripciones (Listar todas las clases inscritas)
router.get("/inscripciones", isAuthenticated, async (req, res) => {
  if (req.user.rol !== "estudiante") {
    return res.status(403).json({ message: "Acción solo para estudiantes." });
  }

  const usuario_id = req.user.id;

  try {
    const inscripcionesQuery = await db.query(
      `SELECT c.id, c.nombre_clase, c.codigo_inscripcion, c.seccion, c.dias, c.hora_inicio, c.hora_fin, u.nombre_completo as nombre_docente
       FROM Clases c
       JOIN Inscripciones i ON c.id = i.clase_id
       JOIN Usuarios u ON c.docente_id = u.id
       WHERE i.usuario_id = $1
       ORDER BY c.nombre_clase ASC`,
      [usuario_id]
    );
    res.json(inscripcionesQuery.rows);
  } catch (error) {
    console.error("Error al obtener las inscripciones:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// POST /api/clases/inscribir (Inscribirse a una clase)
router.post("/inscribir", isAuthenticated, async (req, res) => {
  const { codigo_inscripcion } = req.body;
  const usuario_id = req.user.id;
  const usuario_rol = req.user.rol;

  if (usuario_rol !== "estudiante") {
    return res.status(403).json({
      message: "Prohibido: Solo los estudiantes pueden inscribirse a clases.",
    });
  }
  if (!codigo_inscripcion) {
    return res
      .status(400)
      .json({ message: "El código de inscripción es requerido." });
  }

  try {
    const claseQuery = await db.query(
      "SELECT id FROM Clases WHERE codigo_inscripcion = $1",
      [codigo_inscripcion]
    );

    if (claseQuery.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Clase no encontrada con ese código." });
    }
    const clase_id = claseQuery.rows[0].id;

    const inscripcionExistenteQuery = await db.query(
      "SELECT * FROM Inscripciones WHERE usuario_id = $1 AND clase_id = $2",
      [usuario_id, clase_id]
    );

    if (inscripcionExistenteQuery.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Ya estás inscrito en esta clase." });
    }

    await db.query(
      "INSERT INTO Inscripciones (usuario_id, clase_id) VALUES ($1, $2)",
      [usuario_id, clase_id]
    );

    res.status(200).json({ message: "¡Inscripción exitosa!" });
  } catch (error) {
    console.error("Error al inscribir en la clase:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// --- NUEVA RUTA: GET /api/clases/:id (Detalle básico para el estudiante) ---
router.get("/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { id: usuario_id, rol } = req.user;

  try {
    let claseQuery;

    if (rol === "docente") {
      claseQuery = await db.query(
        `SELECT c.*, u.nombre_completo as nombre_docente 
         FROM Clases c
         JOIN Usuarios u ON c.docente_id = u.id
         WHERE c.id = $1 AND c.docente_id = $2`,
        [id, usuario_id]
      );
    } else {
      claseQuery = await db.query(
        `SELECT c.*, u.nombre_completo as nombre_docente 
         FROM Clases c
         JOIN Inscripciones i ON c.id = i.clase_id
         JOIN Usuarios u ON c.docente_id = u.id
         WHERE c.id = $1 AND i.usuario_id = $2`,
        [id, usuario_id]
      );
    }

    if (claseQuery.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Clase no encontrada o no tienes permiso." });
    }

    res.json(claseQuery.rows[0]);
  } catch (error) {
    console.error("Error al obtener la clase:", error);
    res.status(500).json({ message: "Error interno." });
  }
});

// --- NUEVA RUTA: GET /api/clases/:id/contenido ---
router.get("/:id/contenido", isAuthenticated, async (req, res) => {
  const { id: clase_id } = req.params;

  try {
    // 2. Obtener Módulos
    const modulosQuery = await db.query(
      "SELECT * FROM Modulos WHERE clase_id = $1 ORDER BY orden ASC, id ASC",
      [clase_id]
    );
    const modulos = modulosQuery.rows;

    // 3. Obtener Recursos
    const modulosIds = modulos.map((m) => m.id);

    let recursos = [];
    if (modulosIds.length > 0) {
      const recursosQuery = await db.query(
        "SELECT * FROM Recursos WHERE modulo_id = ANY($1::int[]) ORDER BY fecha_creacion ASC",
        [modulosIds]
      );
      recursos = recursosQuery.rows;
    }

    // 4. URLs firmadas
    const options = {
      version: "v4",
      action: "read",
      expires: Date.now() + 60 * 60 * 1000,
    };

    const recursosProcesados = await Promise.all(
      recursos.map(async (rec) => {
        if (rec.tipo === "archivo") {
          try {
            const [signedUrl] = await bucket
              .file(rec.url)
              .getSignedUrl(options);
            return { ...rec, url_publica: signedUrl };
          } catch (err) {
            console.error("Error firmando URL:", rec.id, err);
            return { ...rec, url_publica: null, error: "No disponible" };
          }
        } else {
          return { ...rec, url_publica: rec.url };
        }
      })
    );

    // 5. Estructurar respuesta
    const contenido = modulos.map((modulo) => ({
      ...modulo,
      recursos: recursosProcesados.filter((r) => r.modulo_id === modulo.id),
    }));

    res.json(contenido);
  } catch (error) {
    console.error("Error al obtener contenido:", error);
    res.status(500).json({ message: "Error interno." });
  }
});
// --- RUTA 13: GRADEBOOK (La Matriz de Notas) ---
router.get("/:id/gradebook", [isAuthenticated, isTeacher], async (req, res) => {
  const { id: clase_id } = req.params;

  try {
    // 1. Obtener todos los ESTUDIANTES inscritos
    const estudiantesQuery = await db.query(
      `SELECT u.id, u.nombre_completo, u.email, u.foto_url 
       FROM Usuarios u
       JOIN Inscripciones i ON u.id = i.usuario_id
       WHERE i.clase_id = $1 AND u.rol = 'estudiante'
       ORDER BY u.nombre_completo ASC`,
      [clase_id]
    );

    // 2. Obtener todas las EVALUACIONES de la clase
    const evaluacionesQuery = await db.query(
      `SELECT id, nombre_evaluacion, tipo_evaluacion 
       FROM Evaluaciones 
       WHERE clase_id = $1 
       ORDER BY fecha_creacion ASC`,
      [clase_id]
    );

    // 3. Obtener todas las NOTAS existentes
    // Hacemos un JOIN complejo para llegar de Evaluacion -> Entrega -> Calificacion
    const notasQuery = await db.query(
      `SELECT 
          e.usuario_id, 
          ev.id as evaluacion_id, 
          c.nota
       FROM Calificaciones c
       JOIN Entregas e ON c.entrega_id = e.id
       JOIN Evaluaciones ev ON e.evaluacion_id = ev.id
       WHERE ev.clase_id = $1`,
      [clase_id]
    );

    // 4. PROCESAMIENTO DE DATOS (Armar la matriz en el Backend)
    const estudiantes = estudiantesQuery.rows;
    const evaluaciones = evaluacionesQuery.rows;
    const notas = notasQuery.rows;

    // Creamos un diccionario rápido para buscar notas: { "usuarioId-evaluacionId": nota }
    const notasMap = {};
    notas.forEach((n) => {
      notasMap[`${n.usuario_id}-${n.evaluacion_id}`] = parseFloat(n.nota);
    });

    // Armamos la respuesta final enriquecida
    const gradebook = estudiantes.map((estudiante) => {
      let sumaNotas = 0;
      let cantidadNotas = 0;

      // Mapeamos las notas de este estudiante para cada evaluación
      const notasEstudiante = evaluaciones.map((evaluacion) => {
        const nota = notasMap[`${estudiante.id}-${evaluacion.id}`];

        if (nota !== undefined && nota !== null) {
          sumaNotas += nota;
          cantidadNotas++;
          return nota; // Retornamos la nota numérica
        }
        return null; // No tiene nota
      });

      // Calculamos promedio simple (puedes mejorarlo con pesos después)
      const promedio =
        cantidadNotas > 0 ? (sumaNotas / cantidadNotas).toFixed(1) : "-";

      return {
        ...estudiante,
        notas: notasEstudiante, // Array de notas en orden [nota1, nota2, null...]
        promedio: promedio,
      };
    });

    res.json({
      meta: {
        evaluaciones: evaluaciones, // Para pintar los encabezados de la tabla
      },
      data: gradebook, // Las filas de la tabla
    });
  } catch (error) {
    console.error("Error al obtener gradebook:", error);
    res.status(500).json({ message: "Error interno al generar el reporte." });
  }
});

// --- RUTA: OBTENER PERSONAS (ALUMNOS) DE UNA CLASE ---
router.get("/:id/personas", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT u.id, u.nombre_completo, u.email, u.foto_url, i.fecha_inscripcion
      FROM Usuarios u
      JOIN Inscripciones i ON u.id = i.usuario_id
      WHERE i.clase_id = $1 AND u.rol = 'estudiante'
      ORDER BY u.nombre_completo ASC
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener personas:", error);
    res.status(500).json({ message: "Error interno." });
  }
});

// --- RUTA: ELIMINAR ALUMNO DE UNA CLASE (EXPULSAR) ---
router.delete(
  "/:id/personas/:usuarioId",
  [isAuthenticated, isTeacher],
  async (req, res) => {
    const { id: clase_id, usuarioId } = req.params;

    try {
      // Borramos la inscripción (Las notas y entregas quedarán huérfanas o se borran si configuraste CASCADE)
      await db.query(
        "DELETE FROM Inscripciones WHERE clase_id = $1 AND usuario_id = $2",
        [clase_id, usuarioId]
      );
      res.json({ message: "Alumno eliminado de la clase." });
    } catch (error) {
      console.error("Error al eliminar alumno:", error);
      res.status(500).json({ message: "Error interno." });
    }
  }
);
module.exports = router;
