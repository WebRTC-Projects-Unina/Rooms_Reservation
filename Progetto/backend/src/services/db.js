import mysql from "mysql2/promise";


let pool;

export async function initDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: "+00:00",
      charset: "utf8mb4"
    });
  }
  return pool;
}

// helper per query
export async function query(sql, params) {
  const p = await initDbPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

export { pool };