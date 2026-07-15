"use strict";
// src/models/schema/users.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
const targets_1 = require("./targets");
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    name: (0, mysql_core_1.varchar)("name", { length: 200 }).notNull(),
    email: (0, mysql_core_1.varchar)("email", { length: 100 }).notNull().unique(),
    phone: (0, mysql_core_1.varchar)("phone", { length: 20 }).notNull().unique(),
    image: (0, mysql_core_1.varchar)("image", { length: 200 }),
    password: (0, mysql_core_1.varchar)("password", { length: 255 }).notNull(),
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "inactive"]).default("active"),
    role: (0, mysql_core_1.mysqlEnum)("role", ["admin", "leader", "sales"]).notNull().default("sales"),
    leader_id: (0, mysql_core_1.char)("leader_id", { length: 36 }).references(() => exports.users.id, { onDelete: "set null" }),
    target_id: (0, mysql_core_1.char)("target_id", { length: 36 }).references(() => targets_1.targets.id, { onDelete: "set null" }),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
