// src/models/schema/target_items.ts

import {
  mysqlTable,
  timestamp,
  double,
  char,
  int 
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { targets } from "./targets";

/**
 * @openapi
 * components:
 *   schemas:
 *     TargetItem:
 *       type: object
 *       required:
 *         - year
 *         - month
 *         - number
 *         - target_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID for the target item
 *           example: "i1111111-1111-1111-1111-111111111111"
 *         year:
 *           type: integer
 *           description: The year for this specific target breakdown
 *           example: 2026
 *         month:
 *           type: integer
 *           description: The month number (1-12)
 *           example: 1
 *         number:
 *           type: number
 *           format: double
 *           description: The specific target metric number for this month
 *           example: 12500.00
 *         target_id:
 *           type: string
 *           format: uuid
 *           description: Foreign key linking to the parent target
 *           example: "t1111111-1111-1111-1111-111111111111"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export const target_items = mysqlTable("target_items", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  year: int("year").notNull(),
  month: int("month").notNull(),
  number: double("number").notNull(),
  target_id: char("target_id", { length: 36 }).references(() => targets.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});