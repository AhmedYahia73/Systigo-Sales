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
  visits: () => visits
});
module.exports = __toCommonJS(stdin_exports);
var import_mysql_core = require("drizzle-orm/mysql-core");
var import_drizzle_orm = require("drizzle-orm");
var import_visitStatus = require("./visitStatus");
var import_users = require("./users");
const visits = (0, import_mysql_core.mysqlTable)("visits", {
  id: (0, import_mysql_core.char)("id", { length: 36 }).primaryKey().default(import_drizzle_orm.sql`(UUID())`),
  lat: (0, import_mysql_core.double)("lat").notNull(),
  lng: (0, import_mysql_core.double)("lng").notNull(),
  name: (0, import_mysql_core.varchar)("name", { length: 255 }).notNull(),
  owner_name: (0, import_mysql_core.varchar)("owner_name", { length: 255 }),
  owner_phone: (0, import_mysql_core.varchar)("owner_phone", { length: 20 }),
  address: (0, import_mysql_core.varchar)("address", { length: 500 }).notNull(),
  notes: (0, import_mysql_core.varchar)("notes", { length: 1e3 }),
  phone: (0, import_mysql_core.varchar)("phone", { length: 20 }).notNull(),
  points: (0, import_mysql_core.int)("points").default(0),
  status: (0, import_mysql_core.mysqlEnum)("status", ["visit", "sales", "delivered"]).default("visit"),
  status_id: (0, import_mysql_core.char)("status_id", { length: 36 }).references(() => import_visitStatus.visitStatus.id, { onDelete: "set null" }),
  sales_id: (0, import_mysql_core.char)("sales_id", { length: 36 }).references(() => import_users.users.id, { onDelete: "set null" }),
  products: (0, import_mysql_core.json)("products"),
  createdAt: (0, import_mysql_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").defaultNow().onUpdateNow()
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  visits
});
