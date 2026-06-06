const mysql = require("mysql2");

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
};

if (process.env.DB_SSL === "true") {
  poolConfig.ssl = { rejectUnauthorized: true };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool.promise();
