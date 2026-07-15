import { boolean, date, int, mysqlTable, timestamp, varchar, char } from "drizzle-orm/mysql-core";
import { plans } from "./plan";
import { organizations } from "./organization";
import { sql } from "drizzle-orm";
import { payment } from "./payment";
import { mysqlEnum } from "drizzle-orm/mysql-core";

export const visitStatus = mysqlTable("visitStatus", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    name: varchar("name", { length: 100 }).notNull(),
    status: boolean("status").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});