const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const db = require("./db");

// --- ESTRATEGIA 1: GOOGLE OAUTH (Para estudiantes y docentes) ---
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      const { id, displayName, emails, photos } = profile;
      const email = emails[0].value;
      const fotoUrl = photos && photos.length > 0 ? photos[0].value : null;

      try {
        // Buscar si existe por Google ID
        let userResult = await db.query(
          "SELECT * FROM Usuarios WHERE google_id = $1",
          [id]
        );

        if (userResult.rows.length > 0) {
          // Usuario existe: Actualizar foto y retornar
          const existingUser = userResult.rows[0];
          await db.query("UPDATE Usuarios SET foto_url = $1 WHERE id = $2", [
            fotoUrl,
            existingUser.id,
          ]);
          existingUser.foto_url = fotoUrl;
          return done(null, existingUser);
        }

        // Si no existe por Google ID, buscar por Email (para fusionar cuentas si el admin lo creó manual)
        userResult = await db.query("SELECT * FROM Usuarios WHERE email = $1", [
          email,
        ]);

        if (userResult.rows.length > 0) {
          // Existe por email (creado manual): Vincular cuenta de Google
          const existingUser = userResult.rows[0];
          await db.query(
            "UPDATE Usuarios SET google_id = $1, foto_url = $2 WHERE id = $3",
            [id, fotoUrl, existingUser.id]
          );
          return done(null, existingUser);
        }

        // Usuario totalmente nuevo: Crear
        const newUserQuery = await db.query(
          "INSERT INTO Usuarios (google_id, nombre_completo, email, rol, foto_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
          [id, displayName, email, "estudiante", fotoUrl] // Rol por defecto: estudiante
        );
        return done(null, newUserQuery.rows[0]);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// --- ESTRATEGIA 2: LOCAL (Usuario y Contraseña - Para Admins/Manuales) ---
passport.use(
  new LocalStrategy(
    {
      usernameField: "email", // Usamos el email como usuario
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // 1. Buscar usuario por email
        const userResult = await db.query(
          "SELECT * FROM Usuarios WHERE email = $1",
          [email]
        );

        if (userResult.rows.length === 0) {
          return done(null, false, { message: "Correo no registrado." });
        }

        const user = userResult.rows[0];

        // 2. Verificar si tiene contraseña (los de Google puro no tienen)
        if (!user.password_hash) {
          return done(null, false, {
            message:
              "Esta cuenta usa Google. Inicia sesión con el botón de Google.",
          });
        }

        // 3. Verificar si está activo (Ban)
        if (user.activo === false) {
          return done(null, false, {
            message: "Tu cuenta ha sido desactivada.",
          });
        }

        // 4. Comparar contraseña
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return done(null, false, { message: "Contraseña incorrecta." });
        }

        // Éxito
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// --- SERIALIZACIÓN DE SESIÓN ---
passport.serializeUser((user, done) => {
  done(null, user.id);
});

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
