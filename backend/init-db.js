const mysql = require("mysql2/promise");
const fs = require("fs");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    const [tables] = await connection.query("SHOW TABLES");

    if (tables.length > 0) {
      throw new Error(
        "Database is not empty. Initialization cancelled."
      );
    }

    const sql = fs.readFileSync("/app/init.sql", "utf8");

    await connection.query(sql);

    console.log("Database tables created successfully!");
  } finally {
    await connection.end();
  }
}

main().catch(error => {
  console.error("Database initialization failed:", error.message);
  process.exit(1);
});
