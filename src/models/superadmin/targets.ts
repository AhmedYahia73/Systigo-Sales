// src/models/schema/targets.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  double,
  char,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// // تعريف نوع الصلاحيات
// export type SuperAdminPermission = {
//   module: string;
//   actions: { id?: string; action: string }[];
// };
// داخل export
//   permissions: json("permissions").$type<SuperAdminPermission[]>().default([]),
export const targets = mysqlTable("targets", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  type: mysqlEnum("type", ["visit", "sales"]).default("visit"),
  name: varchar("name", { length: 255 }).notNull(),
  number: double("number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
