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
  leads: () => leads
});
module.exports = __toCommonJS(stdin_exports);
var import_mysql_core = require("drizzle-orm/mysql-core");
var import_drizzle_orm = require("drizzle-orm");
var import_users = require("./users");
const leads = (0, import_mysql_core.mysqlTable)("leads", {
  id: (0, import_mysql_core.char)("id", { length: 36 }).primaryKey().default(import_drizzle_orm.sql`(UUID())`),
  name: (0, import_mysql_core.varchar)("name", { length: 255 }).notNull(),
  phone: (0, import_mysql_core.varchar)("phone", { length: 20 }).notNull(),
  sales_id: (0, import_mysql_core.char)("sales_id", { length: 36 }).references(() => import_users.users.id, { onDelete: "set null" }),
  place_name: (0, import_mysql_core.varchar)("place_name", { length: 255 }),
  place_phone: (0, import_mysql_core.varchar)("place_phone", { length: 20 }),
  lat: (0, import_mysql_core.double)("lat").notNull(),
  lng: (0, import_mysql_core.double)("lng").notNull(),
  address: (0, import_mysql_core.varchar)("address", { length: 500 }).notNull(),
  notes: (0, import_mysql_core.varchar)("notes", { length: 1e3 }),
  products: (0, import_mysql_core.json)("products"),
  createdAt: (0, import_mysql_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_mysql_core.timestamp)("updated_at").defaultNow().onUpdateNow()
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  leads
});
