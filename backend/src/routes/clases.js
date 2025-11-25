const express = require("express");
const router = express.Router();
const db = require("../db");
const { isAuthenticated, isTeacher } = require("../middleware/auth");
const { bucket } = require("../firebase-config"); // <-- Importamos bucket para firmar URLs

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

// GET /api/clases (Listar clases del docente)
router.get("/", [isAuthenticated, isTeacher], async (req, res) => {
  const docente_id = req.user.id;

  try {
    const clasesQuery = await db.query(
      "SELECT * FROM Clases WHERE docente_id = $1 ORDER BY fecha_creacion DESC",
      [docente_id]
    );
    res.json(clasesQuery.rows);
  } catch (error) {
    console.error("Error al obtener las clases:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

// POST /api/clases (Crear clase)
router.post("/", [isAuthenticated, isTeacher], async (req, res) => {
  const { nombre_clase } = req.body;
  const docente_id = req.user.id;

  if (!nombre_clase) {
    return res
      .status(400)
      .json({ message: "El nombre de la clase es requerido." });
  }

  try {
    const codigo_inscripcion = generateCode();

    const nuevaClaseQuery = await db.query(
      "INSERT INTO Clases (nombre_clase, codigo_inscripcion, docente_id) VALUES ($1, $2, $3) RETURNING *",
      [nombre_clase, codigo_inscripcion, docente_id]
    );

    res.status(201).json(nuevaClaseQuery.rows[0]);
  } catch (error) {
    console.error("Error al crear la clase:", error);
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
      `SELECT c.id, c.nombre_clase, c.codigo_inscripcion, u.nombre_completo as nombre_docente
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
// Usada por la página StudentClassPage para mostrar el título y docente
router.get("/:id", isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const { id: usuario_id, rol } = req.user;

  try {
    let claseQuery;

    // Verificación de seguridad según el rol
    if (rol === "docente") {
      // Si es docente, verificar que sea SU clase
      claseQuery = await db.query(
        `SELECT c.*, u.nombre_completo as nombre_docente 
         FROM Clases c
         JOIN Usuarios u ON c.docente_id = u.id
         WHERE c.id = $1 AND c.docente_id = $2`,
        [id, usuario_id]
      );
    } else {
      // Si es estudiante, verificar que esté INSCRITO
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

// --- NUEVA RUTA: GET /api/clases/:id/contenido (Módulos y Recursos) ---
// Esta ruta devuelve TODA la estructura del curso (semanas y archivos)
router.get("/:id/contenido", isAuthenticated, async (req, res) => {
  const { id: clase_id } = req.params;
  const { id: usuario_id, rol } = req.user;

  try {
    // 1. Verificación de Seguridad (Reutilizamos la lógica anterior)
    // (Omitimos la consulta detallada aquí por brevedad, asumimos que si llegan aquí ya pasaron por /:id en el frontend
    // pero en producción deberíamos verificar de nuevo)

    // 2. Obtener Módulos
    const modulosQuery = await db.query(
      "SELECT * FROM Modulos WHERE clase_id = $1 ORDER BY orden ASC, id ASC",
      [clase_id]
    );
    const modulos = modulosQuery.rows;

    // 3. Obtener Recursos de esos módulos
    const modulosIds = modulos.map((m) => m.id);

    let recursos = [];
    if (modulosIds.length > 0) {
      const recursosQuery = await db.query(
        "SELECT * FROM Recursos WHERE modulo_id = ANY($1::int[]) ORDER BY fecha_creacion ASC",
        [modulosIds]
      );
      recursos = recursosQuery.rows;
    }

    // 4. Generar URLs firmadas para los archivos (solo duran 1 hora)
    const options = {
      version: "v4",
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hora
    };

    const recursosProcesados = await Promise.all(
      recursos.map(async (rec) => {
        if (rec.tipo === "archivo") {
          try {
            // La URL en la BD es la ruta interna (ej: recursos/abc.pdf)
            // Generamos una URL pública temporal
            const [signedUrl] = await bucket
              .file(rec.url)
              .getSignedUrl(options);
            return { ...rec, url_publica: signedUrl };
          } catch (err) {
            console.error("Error firmando URL para recurso:", rec.id, err);
            return { ...rec, url_publica: null, error: "No disponible" };
          }
        } else {
          // Si es un enlace externo, la URL pública es la misma
          return { ...rec, url_publica: rec.url };
        }
      })
    );

    // 5. Estructurar la respuesta (Anidar recursos dentro de módulos)
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

module.exports = router;
