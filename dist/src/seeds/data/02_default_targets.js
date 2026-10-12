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
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_drizzle_orm = require("drizzle-orm");
const seed = {
  name: "02_default_targets",
  async run() {
    console.log("   \u{1F4DD} Inserting rich set of default targets...");
    const targetsData = [
      // 🎯 أهداف المبيعات (Sales Targets) - مبالغ مالية أو صفقات مغلقة
      {
        name: "\u062A\u0627\u0631\u062C\u062A \u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u0633\u0646\u0648\u064A \u0627\u0644\u0623\u0648\u0644 (Q1)",
        type: "sales",
        number: 15e4
        // مثلاً 150 ألف جنيه/دولار
      },
      {
        name: "\u062A\u0627\u0631\u062C\u062A \u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u0631\u0628\u0639 \u0627\u0644\u0633\u0646\u0648\u064A \u0627\u0644\u062B\u0627\u0646\u064A (Q2)",
        type: "sales",
        number: 25e4
      },
      {
        name: "\u062A\u0627\u0631\u062C\u062A \u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646 \u0627\u0644\u0645\u0628\u062A\u062F\u0626\u064A\u0646 \u0634\u0647\u0631\u064A\u0627\u064B",
        type: "sales",
        number: 15e3
      },
      {
        name: "\u062A\u0627\u0631\u062C\u062A \u0645\u0628\u064A\u0639\u0627\u062A \u0643\u0628\u0627\u0631 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 (VIP)",
        type: "sales",
        number: 5e5
      },
      // 🚗 أهداف الزيارات (Visits Targets) - عدد زيارات للعملاء على الأرض أو الاجتماعات
      {
        name: "\u062A\u0627\u0631\u062C\u062A \u0632\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0628\u064A\u0639\u0627\u062A \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A",
        type: "visit",
        number: 20
        // 20 زيارة ميدانية في الأسبوع
      },
      {
        name: "\u062A\u0627\u0631\u062C\u062A \u0632\u064A\u0627\u0631\u0627\u062A \u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062A \u0634\u0647\u0631\u064A\u0627\u064B",
        type: "visit",
        number: 80
      },
      {
        name: "\u062A\u0627\u0631\u062C\u062A \u0627\u062C\u062A\u0645\u0627\u0639\u0627\u062A \u0627\u0644\u0640 Zoom \u0648\u0627\u0644\u0640 Online \u0627\u0644\u064A\u0648\u0645\u064A",
        type: "visit",
        number: 5
        // 5 اجتماعات يومياً لكل مندوب
      },
      {
        name: "\u062A\u0627\u0631\u062C\u062A \u0632\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0648\u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A",
        type: "visit",
        number: 12
      }
    ];
    console.log("   \u{1F4E5} Saving targets...");
    await import_db.db.insert(import_schema.targets).values(targetsData);
    console.log(`   \u{1F680} Completed! Seeded ${targetsData.length} diverse targets.`);
  },
  async rollback() {
    console.log("   \u{1F5D1}\uFE0F Rolling back seeded targets...");
    await import_db.db.delete(import_schema.targets).where(
      import_drizzle_orm.sql`id LIKE 't1111111%' OR id LIKE 't2222222%' OR id LIKE 't3333333%' OR id LIKE 't4444444%' OR id LIKE 't5555555%' OR id LIKE 't6666666%' OR id LIKE 't7777777%' OR id LIKE 't8888888%'`
    );
    console.log("   \u2705 Rollback completed successfully.");
  }
};
var stdin_default = seed;
