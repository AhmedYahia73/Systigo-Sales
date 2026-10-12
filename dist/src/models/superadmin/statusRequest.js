var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  statusRequest: () => statusRequest
});
module.exports = __toCommonJS(stdin_exports);
var import_mysql_core = require("drizzle-orm/mysql-core");
var import_drizzle_orm = require("drizzle-orm");
var import_users = require("./users");
var import_visits = require("./visits");
const statusRequest = (0, import_mysql_core.mysqlTable)("status_requests", {
  id: (0, import_mysql_core.char)("id", { length: 36 }).primaryKey().default(import_drizzle_orm.sql`(UUID())`),
  visitId: (0, import_mysql_core.char)("visit_id", { length: 36 }).notNull().references(() => import_visits.visits.id, { onDelete: "cascade" }),
  userId: (0, import_mysql_core.char)("user_id", { length: 36 }).notNull().references(() => import_users.users.id, { onDelete: "cascade" }),
  from: (0, import_mysql_core.mysqlEnum)("from", ["visit", "sales", "delivered"]).notNull(),
  to: (0, import_mysql_core.mysqlEnum)("to", ["visit", "sales", "delivered"]).notNull(),
  status: (0, import_mysql_core.mysqlEnum)("status", ["pending", "approve", "reject"]).default("pending").notNull(),
  createdAt: (0, import_mysql_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").defaultNow().onUpdateNow()
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  statusRequest
});
