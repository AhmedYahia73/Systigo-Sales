// src/models/schema/visits.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  char,
  double,
  int,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { visitStatus } from "./visitStatus";
import { users } from "./users";
import { products } from "./products";

export const visits = mysqlTable("visits", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  lat: double("lat").notNull(),
  lng: double("lng").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  notes: varchar("notes", { length: 1000 }),
  phone: varchar("phone", { length: 20 }).notNull(),
 
   points: int("points"),
  status: mysqlEnum("status", ["visit", "sales", "delivered"]).default("visit"),
  status_id: char("status_id", { length: 36 }).references(() => visitStatus.id, { onDelete: "set null" }),
  sales_id: char("sales_id", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
  product_id: char("product_id", { length: 36 }).references(() => products.id, { onDelete: "set null" }),
  duration: varchar("duration", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
