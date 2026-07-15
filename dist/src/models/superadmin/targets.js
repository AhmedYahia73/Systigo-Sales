"use strict";
// src/models/schema/targets.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.targets = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
// // تعريف نوع الصلاحيات
// export type SuperAdminPermission = {
//   module: string;
//   actions: { id?: string; action: string }[];
// };
// داخل export
//   permissions: json("permissions").$type<SuperAdminPermission[]>().default([]),
exports.targets = (0, mysql_core_1.mysqlTable)("targets", {
    id: (0, mysql_core_1.char)("id", { length: 36 }).primaryKey().default((0, drizzle_orm_1.sql) `(UUID())`),
    type: (0, mysql_core_1.mysqlEnum)("type", ["visit", "sales"]).default("visit"),
    name: (0, mysql_core_1.varchar)("name", { length: 255 }).notNull(),
    number: (0, mysql_core_1.double)("number").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, mysql_core_1.timestamp)("updated_at").defaultNow().onUpdateNow(),
});
