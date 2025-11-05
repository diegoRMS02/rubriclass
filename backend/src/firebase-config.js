const admin = require("firebase-admin");

// 1. Reemplaza con el nombre de tu archivo JSON
const serviceAccount = require("../firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // 2. Reemplaza con la URL de tu bucket de Firebase Storage
  // La encuentras en la pestaña "Archivos" de Firebase Storage
  storageBucket: "gs://rubriclass-proyecto.firebasestorage.app",
});

// Exportamos el "bucket" (almacén) para poder usarlo en otras partes
const bucket = admin.storage().bucket();

module.exports = { bucket };
