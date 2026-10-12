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
  name: "04_default_visit_status",
  async run() {
    console.log("   \u{1F4DD} Inserting comprehensive default visit statuses...");
    const statusPendingId = "st111111-1111-1111-1111-111111111111";
    const statusInterestedId = "st222222-2222-2222-2222-222222222222";
    const statusDoneId = "st333333-3333-3333-3333-333333333333";
    const visitStatusesData = [
      {
        name: "\u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 / \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 (Pending)",
        status: true
      },
      {
        name: "\u0645\u0647\u062A\u0645 \u0628\u0627\u0644\u062A\u0639\u0627\u0642\u062F (Interested / Lead)",
        status: true
      },
      {
        name: "\u062A\u0645\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0628\u0646\u062C\u0627\u062D (Closed Won)",
        status: true
      },
      {
        name: "\u063A\u064A\u0631 \u0645\u0647\u062A\u0645 \u062D\u0627\u0644\u064A\u0627\u064B (Not Interested)",
        status: true
      },
      {
        name: "\u0645\u0624\u062C\u0644 \u0644\u0639\u062F\u0645 \u0627\u0644\u062A\u0648\u0627\u062C\u062F (Postponed)",
        status: true
      },
      {
        name: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D / \u0648\u0647\u0645\u064A (Invalid Location)",
        status: true
      },
      {
        name: "\u0645\u0644\u063A\u064A \u0645\u0646 \u0642\u0650\u0628\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 (Canceled)",
        status: true
      }
    ];
    console.log("   \u{1F4E5} Saving visit statuses...");
    await import_db.db.insert(import_schema.visitStatus).values(visitStatusesData);
    console.log(`   \u{1F680} Completed! Seeded ${visitStatusesData.length} visit statuses.`);
  },
  async rollback() {
    console.log("   \u{1F5D1}\uFE0F Rolling back seeded visit statuses...");
    await import_db.db.delete(import_schema.visitStatus).where(
      import_drizzle_orm.sql`id LIKE 'st111111%' OR id LIKE 'st222222%' OR id LIKE 'st333333%' OR id LIKE 'st444444%' OR id LIKE 'st555555%' OR id LIKE 'st666666%' OR id LIKE 'st777777%'`
    );
    console.log("   \u2705 Rollback completed successfully.");
  }
};
var stdin_default = seed;
