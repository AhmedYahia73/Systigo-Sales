// src/models/schema/target_sales.ts

import {
  mysqlTable,
  timestamp,
  char
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { targets } from "./targets";

export const target_sales = mysqlTable("target_sales", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  target_id: char("target_id", { length: 36 }).references(() => targets.id, { onDelete: "cascade" }),
  // References Parent DB (Taskito) users.id via cross-database queries
  user_id: char("user_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
