const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"], // Pedimos perfil (incluye foto) y email
    },
    async (accessToken, refreshToken, profile, done) => {
      const { id, displayName, emails, photos } = profile;
      const email = emails[0].value;
      // Obtenemos la foto (si existe)
      const fotoUrl = photos && photos.length > 0 ? photos[0].value : null;

      try {
        // 1. Buscamos si el usuario ya existe
        const currentUserQuery = await db.query(
          "SELECT * FROM Usuarios WHERE google_id = $1",
          [id]
        );

        if (currentUserQuery.rows.length > 0) {
          // --- USUARIO EXISTENTE ---
          const existingUser = currentUserQuery.rows[0];

          // Actualizamos la foto en la BD para mantenerla sincronizada con Google
          await db.query("UPDATE Usuarios SET foto_url = $1 WHERE id = $2", [
            fotoUrl,
            existingUser.id,
          ]);

          // Actualizamos el objeto localmente para pasarlo a la sesión
          existingUser.foto_url = fotoUrl;

          console.log(
            "Usuario existente logueado:",
            existingUser.nombre_completo
          );
          done(null, existingUser);
        } else {
          // --- USUARIO NUEVO ---
          // Lo creamos incluyendo la foto_url
          const newUserQuery = await db.query(
            "INSERT INTO Usuarios (google_id, nombre_completo, email, rol, foto_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [id, displayName, email, "estudiante", fotoUrl]
          );
          console.log("Nuevo usuario creado:", newUserQuery.rows[0]);
          done(null, newUserQuery.rows[0]);
        }
      } catch (error) {
        console.error("Error en autenticación:", error);
        done(error, null);
      }
    }
  )
);

// Guarda el ID del usuario en la sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Obtiene los datos del usuario a partir del ID de la sesión
passport.deserializeUser(async (id, done) => {
  try {
    const userQuery = await db.query("SELECT * FROM Usuarios WHERE id = $1", [
      id,
    ]);
    done(null, userQuery.rows[0]);
  } catch (error) {
    done(error, null);
  }
});
