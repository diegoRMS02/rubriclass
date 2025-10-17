const { Pool } = require("pg");
require("dotenv").config();

// Crear un pool de conexiones usando las variables de entorno
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Exportamos una función para hacer consultas
module.exports = {
  query: (text, params) => pool.query(text, params),
};
