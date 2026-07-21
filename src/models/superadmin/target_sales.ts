// src/models/schema/target_sales.ts

import {
  mysqlTable,
  timestamp,
  char
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { targets } from "./targets"; // تأكد أن جدول targets الرئيسي معرف في ملف "./targets"
import { users } from "./users";

/**
 * @openapi
 * components:
 *   schemas:
 *     TargetSale:
 *       type: object
 *       required:
 *         - target_id
 *         - user_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID for the target sale assignment
 *           example: "s1111111-1111-1111-1111-111111111111"
 *         target_id:
 *           type: string
 *           format: uuid
 *           description: Foreign key linking to the target
 *           example: "t1111111-1111-1111-1111-111111111111"
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: Foreign key linking to the assigned sales user
 *           example: "u1111111-1111-1111-1111-111111111111"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Assignment creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export const target_sales = mysqlTable("target_sales", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  target_id: char("target_id", { length: 36 }).references(() => targets.id, { onDelete: "cascade" }),
  user_id: char("user_id", { length: 36 }).references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});