import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(
      `PostgreSQL connected | HOST: ${client.host} | DB: ${client.database}`
    );
    client.release();
  } catch (error) {
    console.error("PostgreSQL connection FAILED:", error.message);
    process.exit(1);
  }
};

export { pool, connectDB };
