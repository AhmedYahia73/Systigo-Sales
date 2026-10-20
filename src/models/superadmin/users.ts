// src/models/schema/users.ts

import {
  mysqlTable,
  mysqlSchema,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  boolean,
  json,
  AnyMySqlColumn
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import "dotenv/config";

// If TASKITO_DB_NAME / PARENT_DB_NAME is provided in .env, users table will reference the Parent DB schema
const parentDbName = process.env.TASKITO_DB_NAME || process.env.PARENT_DB_NAME;
const tableCreator = parentDbName ? mysqlSchema(parentDbName).table : mysqlTable;

export const users = tableCreator("users", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`), 

  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  whatsapp: varchar("whatsapp", { length: 20 }),
  image: varchar("image", { length: 200 }),
  vector_image_array: json("vector_image_array"),
  password: varchar("password", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  role: mysqlEnum("role", ["super_admin", "admin", "tester", "engineer", "leader", "sales"]).notNull().default("sales"),
  points: int("points").default(0),
  yearly_holidays: boolean("yearly_holidays").default(false),
  zone_id: char("zone_id", { length: 36 }),
  shift_id: char("shift_id", { length: 36 }),
  department_id: char("department_id", { length: 36 }),

  // Sales CRM Integration Fields
  leader_id: char("leader_id", { length: 36 }).references((): AnyMySqlColumn => users.id, { onDelete: "set null" }),
  target_id: char("target_id", { length: 36 }),
  sales_project_id: char("sales_project_id", { length: 36 }),
  sales_project_ids: json("sales_project_ids"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
