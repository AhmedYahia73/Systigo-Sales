import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

import "dotenv/config";

// 1. Primary Database Connection Pool (Systigo-Sales)
const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };

// 2. Parent Database Connection Pool (Taskito HRM - Parent DB)
const taskitoPool = mysql.createPool({
  host: process.env.TASKITO_DB_HOST || process.env.DB_HOST || "localhost",
  user: process.env.TASKITO_DB_USER || process.env.DB_USER!,
  password: process.env.TASKITO_DB_PASSWORD || process.env.DB_PASSWORD!,
  database: process.env.TASKITO_DB_NAME || "wegostation_tasketo",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const taskitoDb = drizzle(taskitoPool, { schema, mode: "default" });
export { taskitoPool };
