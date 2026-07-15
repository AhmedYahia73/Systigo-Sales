// src/models/schema/superAdmin.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  double,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { superAdminRoles } from "./targets";

export const visits = mysqlTable("visits", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  lat: double("lat").notNull(),
  lng: double("lng").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  notes: varchar("notes", { length: 1000 }),
  phone: varchar("phone", { length: 20 }).notNull(),
 
  status: mysqlEnum("status", ["visit", "sales", "delivered"]).default("active"),
  status_id: char("status_id", { length: 36 }).references(() => visitStatus.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
