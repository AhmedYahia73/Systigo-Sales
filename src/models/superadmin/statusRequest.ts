// src/models/schema/statusRequest.ts

import {
  mysqlTable,
  timestamp,
  mysqlEnum,
  char
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from './users';
import { visits } from './visits';

/**
 * @openapi
 * components:
 *   schemas:
 *     StatusRequest:
 *       type: object
 *       required:
 *         - visitId
 *         - userId
 *         - from
 *         - to
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID for the status request
 *           example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
 *         visitId:
 *           type: string
 *           format: uuid
 *           description: ID of the associated visit
 *           example: "v1111111-1111-1111-1111-111111111111"
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user creating the request
 *           example: "u1111111-1111-1111-1111-111111111111"
 *         from:
 *           type: string
 *           enum: [visit, sales, delivered]
 *           description: Current status before the request
 *           example: "visit"
 *         to:
 *           type: string
 *           enum: [visit, sales, delivered]
 *           description: Requested status
 *           example: "sales"
 *         status:
 *           type: string
 *           enum: [pending, approve, reject]
 *           default: pending
 *           description: Approval status of the request
 *           example: "pending"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
export const statusRequest = mysqlTable("status_requests", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  visitId: char("visit_id", { length: 36 })
    .notNull()
    .references(() => visits.id, { onDelete: "cascade" }),
  userId: char("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  from: mysqlEnum("from", ["visit", "sales", "delivered"]).notNull(),
  to: mysqlEnum("to", ["visit", "sales", "delivered"]).notNull(),
  status: mysqlEnum("status", ["pending", "approve", "reject"]).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});