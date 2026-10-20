"use strict";
// src/models/schema/target_sales.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.target_sales = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const targets_1 = require("./targets");
exports.target_sales = (0, mysql_core_1.mysqlTable)("target_sales", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    target_id: (0, mysql_core_1.char)("target_id", { length: 36 }).references(() => targets_1.targets.id, { onDelete: "cascade" }),
    // References Parent DB (Taskito) users.id via cross-database queries
    user_id: (0, mysql_core_1.char)("user_id", { length: 36 }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
