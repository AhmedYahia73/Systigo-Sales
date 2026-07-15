// src/models/schema/busType.ts

import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  mysqlEnum,
  char,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { targets } from "./targets";
export const users = mysqlTable("users", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`), 

  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  image: varchar("image", { length: 200 }),
  password: varchar("password", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  role: mysqlEnum("role", ["admin", "leader", "sales"]).notNull().default("sales"),
  leader_id: char("leader_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  target_id: char("target_id", { length: 36 }).references(() => targets.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
