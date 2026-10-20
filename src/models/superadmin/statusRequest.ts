// src/models/schema/statusRequest.ts

import {
  mysqlTable,
  timestamp,
  mysqlEnum,
  char
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { visits } from './visits';

export const statusRequest = mysqlTable("status_requests", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  sales_project_id: char("sales_project_id", { length: 36 }),
  visitId: char("visit_id", { length: 36 })
    .notNull()
    .references(() => visits.id, { onDelete: "cascade" }),
  // References Parent DB (Taskito) users.id via cross-database queries
  userId: char("user_id", { length: 36 })
    .notNull(),
  from: mysqlEnum("from", ["visit", "sales", "delivered"]).notNull(),
  to: mysqlEnum("to", ["visit", "sales", "delivered"]).notNull(),
  status: mysqlEnum("status", ["pending", "approve", "reject"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
