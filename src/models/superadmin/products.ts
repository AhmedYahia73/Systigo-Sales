// src/models/schema/visits.ts

import {
  mysqlTable,
  varchar,
  timestamp,
  json,
  char,
  double,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { visitStatus } from "./visitStatus";
import { users } from "./users";

export const products = mysqlTable("products", {
  id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`), 
  name: varchar("name", { length: 255 }).notNull(),
  feez: double("feez").default(0),
  description: varchar("description", { length: 1000 }),
  demo_link: varchar("demo_link", { length: 200 }), 
  points: json("points").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
