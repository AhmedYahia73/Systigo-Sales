// src/models/superadmin/wishList.ts

import { boolean, date, int, mysqlTable, timestamp, varchar, char } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm"; 

export const wishList = mysqlTable("wishList", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    sales_project_id: char("sales_project_id", { length: 36 }),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 1000 }),
    // References Parent DB (Taskito) users.id via cross-database queries
    sales_id: char("sales_id", { length: 36 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
