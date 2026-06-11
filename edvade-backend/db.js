const mysql = require("mysql2");

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl =
  process.env.MYSQL_URL ||
  process.env.MYSQL_PUBLIC_URL ||
  process.env.DATABASE_URL;

function configFromUrl(url) {
  const parsed = new URL(url);

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
}

const envConfig = databaseUrl
  ? configFromUrl(databaseUrl)
  : {
      host: isProduction
        ? process.env.MYSQLHOST || process.env.DB_HOST
        : process.env.DB_HOST || process.env.MYSQLHOST,
      port: Number(
        isProduction
          ? process.env.MYSQLPORT || process.env.DB_PORT || 3306
          : process.env.DB_PORT || process.env.MYSQLPORT || 3306
      ),
      user: isProduction
        ? process.env.MYSQLUSER || process.env.DB_USER
        : process.env.DB_USER || process.env.MYSQLUSER,
      password: isProduction
        ? process.env.MYSQLPASSWORD || process.env.DB_PASS
        : process.env.DB_PASS || process.env.MYSQLPASSWORD,
      database: isProduction
        ? process.env.MYSQLDATABASE || process.env.DB_NAME
        : process.env.DB_NAME || process.env.MYSQLDATABASE,
    };

const missing = ["host", "user", "password", "database"].filter((key) => !envConfig[key]);
if (missing.length) {
  throw new Error(`Missing database config: ${missing.join(", ")}`);
}

const poolConfig = {
  ...envConfig,
  waitForConnections: true,
  connectionLimit: 10,
};

if (process.env.DB_SSL === "true") {
  poolConfig.ssl = { rejectUnauthorized: true };
}

const pool = mysql.createPool(poolConfig);

module.exports = pool.promise();
