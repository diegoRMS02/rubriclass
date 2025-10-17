const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"], // Pedimos el perfil y el email del usuario
    },
    async (accessToken, refreshToken, profile, done) => {
      // Esta función se ejecuta cuando Google nos devuelve la información del usuario
      const { id, displayName, emails } = profile;
      const email = emails[0].value;

      try {
        // 1. Buscamos si el usuario ya existe en nuestra base de datos
        const currentUserQuery = await db.query(
          "SELECT * FROM Usuarios WHERE google_id = $1",
          [id]
        );

        if (currentUserQuery.rows.length > 0) {
          // Si existe, lo pasamos al siguiente paso (serializar)
          console.log("Usuario ya existe:", currentUserQuery.rows[0]);
          done(null, currentUserQuery.rows[0]);
        } else {
          // 2. Si no existe, lo creamos en nuestra base de datos
          // Por defecto, el primer rol de un usuario nuevo será 'estudiante'
          const newUserQuery = await db.query(
            "INSERT INTO Usuarios (google_id, nombre_completo, email, rol) VALUES ($1, $2, $3, $4) RETURNING *",
            [id, displayName, email, "estudiante"]
          );
          console.log("Nuevo usuario creado:", newUserQuery.rows[0]);
          done(null, newUserQuery.rows[0]);
        }
      } catch (error) {
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
