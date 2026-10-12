var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_drizzle_orm = require("drizzle-orm");
var import_bcrypt = __toESM(require("bcrypt"));
const seed = {
  name: "01_admin",
  async run() {
    console.log("   \u{1F4DD} Inserting rich set of default users (Admins, Leaders, Sales)...");
    const defaultPassword = await import_bcrypt.default.hash("password123", 10);
    const leader1Id = "11111111-1111-1111-1111-111111111111";
    const leader2Id = "22222222-2222-2222-2222-222222222222";
    const leader3Id = "33333333-3333-3333-3333-333333333333";
    const adminsData = [
      {
        name: "\u0623\u062D\u0645\u062F \u0627\u0644\u0639\u0634\u0631\u064A (\u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645)",
        email: "admin1@crm.com",
        phone: "+201011111111",
        password: defaultPassword,
        role: "admin",
        status: "active"
      },
      {
        name: "\u0645\u0646\u0649 \u0645\u062D\u0645\u0648\u062F (\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0645\u0644\u064A\u0627\u062A)",
        email: "admin2@crm.com",
        phone: "+201022222222",
        password: defaultPassword,
        role: "admin",
        status: "active"
      }
    ];
    const leadersData = [
      {
        name: "\u0643\u0631\u064A\u0645 \u062E\u0627\u0644\u062F (\u0642\u0627\u0626\u062F \u0641\u0631\u064A\u0642 \u0627\u0644\u0642\u0627\u0647\u0631\u0629)",
        email: "karim.leader@crm.com",
        phone: "+201033333333",
        password: defaultPassword,
        role: "leader",
        status: "active"
      },
      {
        name: "\u064A\u0627\u0633\u0645\u064A\u0646 \u062A\u0627\u0645\u0631 (\u0642\u0627\u0626\u062F\u0629 \u0641\u0631\u064A\u0642 \u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629)",
        email: "yasmin.leader@crm.com",
        phone: "+201044444444",
        password: defaultPassword,
        role: "leader",
        status: "active"
      },
      {
        name: "\u0645\u0635\u0637\u0641\u0649 \u0647\u0644\u0627\u0644 (\u0642\u0627\u0626\u062F \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629)",
        email: "mostafa.leader@crm.com",
        phone: "+201055555555",
        password: defaultPassword,
        role: "leader",
        status: "active"
      }
    ];
    const salesData = [
      // 👥 مبيعات تابعين للقائد الأول (كريم)
      {
        name: "\u0639\u0645\u0631 \u0634\u0631\u064A\u0641",
        email: "omar.sales@crm.com",
        phone: "+201066666661",
        password: defaultPassword,
        role: "sales",
        leader_id: leader1Id,
        status: "active"
      },
      {
        name: "\u0646\u0647\u0649 \u0641\u0631\u064A\u062F",
        email: "noha.sales@crm.com",
        phone: "+201066666662",
        password: defaultPassword,
        role: "sales",
        leader_id: leader1Id,
        status: "active"
      },
      {
        name: "\u0632\u064A\u0627\u062F \u0637\u0627\u0631\u0642",
        email: "ziad.sales@crm.com",
        phone: "+201066666663",
        password: defaultPassword,
        role: "sales",
        leader_id: leader1Id,
        status: "inactive"
        // حساب خامل للتجربة والفلترة
      },
      // 👥 مبيعات تابعين للقائد الثاني (ياسمين)
      {
        name: "\u0633\u0627\u0631\u0629 \u0633\u0644\u064A\u0645\u0627\u0646",
        email: "sarah.sales@crm.com",
        phone: "+201077777771",
        password: defaultPassword,
        role: "sales",
        leader_id: leader2Id,
        status: "active"
      },
      {
        name: "\u0645\u0631\u0648\u0627\u0646 \u0623\u0645\u064A\u0646",
        email: "marwan.sales@crm.com",
        phone: "+201077777772",
        password: defaultPassword,
        role: "sales",
        leader_id: leader2Id,
        status: "active"
      },
      {
        name: "\u062F\u064A\u0646\u0627 \u0631\u0627\u0645\u064A",
        email: "dina.sales@crm.com",
        phone: "+201077777773",
        password: defaultPassword,
        role: "sales",
        leader_id: leader2Id,
        status: "active"
      },
      // 👥 مبيعات تابعين للقائد الثالث (مصطفى)
      {
        name: "\u062E\u0627\u0644\u062F \u0645\u0646\u0635\u0648\u0631",
        email: "khaled.sales@crm.com",
        phone: "+201088888881",
        password: defaultPassword,
        role: "sales",
        leader_id: leader3Id,
        status: "active"
      },
      {
        name: "\u0645\u064A\u0627\u062F\u0629 \u062D\u0633\u0646",
        email: "mayada.sales@crm.com",
        phone: "+201088888882",
        password: defaultPassword,
        role: "sales",
        leader_id: leader3Id,
        status: "active"
      },
      {
        name: "\u0647\u0627\u0646\u064A \u064A\u0648\u0633\u0641",
        email: "hani.sales@crm.com",
        phone: "+201088888883",
        password: defaultPassword,
        role: "sales",
        leader_id: leader3Id,
        status: "active"
      }
    ];
    console.log("   \u{1F4E5} Saving Admins...");
    await import_db.db.insert(import_schema.users).values(adminsData);
    console.log("   \u{1F4E5} Saving Leaders...");
    await import_db.db.insert(import_schema.users).values(leadersData);
    console.log("   \u{1F4E5} Saving Sales...");
    await import_db.db.insert(import_schema.users).values(salesData);
    console.log(`   \u{1F680} Completed! Seeded 2 Admins, 3 Leaders, and 9 Sales.`);
  },
  async rollback() {
    console.log("   \u{1F5D1}\uFE0F Rolling back seeded users...");
    await import_db.db.delete(import_schema.users).where(
      import_drizzle_orm.sql`id LIKE 'a000000%' OR id IN (${import_drizzle_orm.sql.placeholder("l1")}, ${import_drizzle_orm.sql.placeholder("l2")}, ${import_drizzle_orm.sql.placeholder("l3")}) OR id LIKE 's100000%' OR id LIKE 's200000%' OR id LIKE 's300000%'`
    ).execute({
      l1: "11111111-1111-1111-1111-111111111111",
      l2: "22222222-2222-2222-2222-222222222222",
      l3: "33333333-3333-3333-3333-333333333333"
    });
    console.log("   \u2705 Rollback completed successfully.");
  }
};
var stdin_default = seed;
