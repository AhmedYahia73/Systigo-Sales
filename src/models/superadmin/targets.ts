// src/models/schema/targets.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  double,
  char,
  int
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// // تعريف نوع الصلاحيات
// export type SuperAdminPermission = {
//   module: string;
//   actions: { id?: string; action: string }[];
// };
// داخل export
//   permissions: json("permissions").$type<SuperAdminPermission[]>().default([]),

/**
 * @openapi
 * components:
 *   schemas:
 *     Target:
 *       type: object
 *       required:
 *         - name
 *         - number
 *         - year
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID for the target
 *           example: "t1111111-1111-1111-1111-111111111111"
 *         type:
 *           type: string
 *           enum: [visit, sales]
 *           default: visit
 *           description: The type of target (visit count or sales amount)
 *           example: "sales"
 *         name:
 *           type: string
 *           description: The name/title of the target
 *           example: "تارجت مبيعات الربع الأول"
 *         number:
 *           type: number
 *           format: double
 *           description: The target metric number (value in currency or visits count)
 *           example: 150000.00
 *         year:
 *           type: int
 *           description: The target year
 *           example: 2026
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export const targets = mysqlTable("targets", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  type: mysqlEnum("type", ["visit", "sales"]).default("visit"),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});