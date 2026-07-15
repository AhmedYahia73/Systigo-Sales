import { boolean, date, int, mysqlTable, timestamp, varchar, char } from "drizzle-orm/mysql-core";
import { plans } from "./plan";
import { organizations } from "./organization";
import { sql } from "drizzle-orm";
import { payment } from "./payment";
import { mysqlEnum } from "drizzle-orm/mysql-core";

export const wishList = mysqlTable("wishList", {
    id: char("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 1000 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});