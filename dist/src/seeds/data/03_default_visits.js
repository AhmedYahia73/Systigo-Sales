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
  name: "03_default_visits",
  async run() {
    console.log("   \u{1F4DD} Inserting rich set of default visits (Catering to various status scenarios)...");
    const statusPendingId = "st111111-1111-1111-1111-111111111111";
    const statusInterestedId = "st222222-2222-2222-2222-222222222222";
    const statusDoneId = "st333333-3333-3333-3333-333333333333";
    const visitsData = [
      // 🏙️ زيارات منطقة القاهرة والجيزة
      {
        name: "\u0634\u0631\u0643\u0629 \u0627\u0644\u0646\u064A\u0644 \u0644\u0644\u062A\u062C\u0627\u0631\u0629 \u0648\u0627\u0644\u062A\u0648\u0632\u064A\u0639",
        owner_name: "\u0623\u062D\u0645\u062F \u0627\u0644\u0646\u062C\u0627\u0631",
        owner_phone: "+201099887766",
        phone: "+201011223344",
        lat: 30.0444,
        // وسط البلد - القاهرة
        lng: 31.2357,
        address: "\u0634\u0627\u0631\u0639 \u0637\u0644\u0639\u062A \u062D\u0631\u0628\u060C \u0648\u0633\u0637 \u0627\u0644\u0628\u0644\u062F\u060C \u0627\u0644\u0642\u0627\u0647\u0631\u0629 - \u0627\u0644\u062F\u0648\u0631 \u0627\u0644\u062B\u0627\u0644\u062B",
        notes: "\u0627\u0644\u0639\u0645\u064A\u0644 \u0645\u0647\u062A\u0645 \u0628\u0646\u0638\u0627\u0645 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0627\u0644\u0633\u0646\u0648\u064A\u0629\u060C \u064A\u062D\u062A\u0627\u062C \u0644\u0645\u0639\u0627\u0648\u062F\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0644\u062A\u062D\u062F\u064A\u062F \u0645\u0648\u0639\u062F \u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0639\u0642\u062F.",
        status: "sales",
        status_id: statusInterestedId
      },
      {
        name: "\u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062A \u0641\u0631\u064A\u0646\u062F\u0632",
        owner_name: "\u0645\u062D\u0645\u062F \u0641\u0631\u064A\u062F",
        owner_phone: "+201299887766",
        phone: "+201211223344",
        lat: 30.0131,
        // المعادي - القاهرة
        lng: 31.2824,
        address: "\u0634\u0627\u0631\u0639 9\u060C \u0627\u0644\u0645\u0639\u0627\u062F\u064A\u060C \u0627\u0644\u0642\u0627\u0647\u0631\u0629 \u0628\u062C\u0648\u0627\u0631 \u0645\u062D\u0637\u0629 \u0627\u0644\u0645\u062A\u0631\u0648",
        notes: "\u062A\u0645\u062A \u0627\u0644\u0632\u064A\u0627\u0631\u0629 \u0648\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u062A\u062C\u060C \u0627\u0644\u0639\u0645\u064A\u0644 \u064A\u0637\u0644\u0628 \u062A\u062E\u0641\u064A\u0636 \u0625\u0636\u0627\u0641\u064A \u0628\u0646\u0633\u0628\u0629 5% \u0644\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0637\u0644\u0628\u064A\u0629 \u0627\u0644\u0634\u0631\u0627\u0621 \u0627\u0644\u0623\u0648\u0644\u0649.",
        status: "visit",
        status_id: statusPendingId
      },
      {
        name: "\u0645\u062C\u0645\u0648\u0639\u0629 \u0635\u064A\u062F\u0644\u064A\u0627\u062A \u0627\u0644\u0634\u0641\u0627\u0621",
        owner_name: "\u062F. \u0647\u0627\u0646\u064A \u0634\u0627\u0643\u0631",
        owner_phone: null,
        phone: "+201111223344",
        lat: 30.0561,
        // المهندسين - الجيزة
        lng: 31.2017,
        address: "\u0634\u0627\u0631\u0639 \u062C\u0627\u0645\u0639\u0629 \u0627\u0644\u062F\u0648\u0644 \u0627\u0644\u0639\u0631\u0628\u064A\u0629\u060C \u0627\u0644\u0645\u0647\u0646\u062F\u0633\u064A\u0646\u060C \u0627\u0644\u062C\u064A\u0632\u0629 - \u0623\u0645\u0627\u0645 \u0645\u0633\u062C\u062F \u0645\u0635\u0637\u0641\u0649 \u0645\u062D\u0645\u0648\u062F",
        notes: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0641\u0627\u062A\u0648\u0631\u0629 \u0648\u0627\u0644\u0627\u062A\u0641\u0627\u0642 \u0627\u0644\u0646\u0647\u0627\u0626\u064A \u0639\u0644\u0649 \u062A\u0648\u0631\u064A\u062F \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0637\u0628\u064A\u0629.",
        status: "delivered",
        status_id: statusDoneId
      },
      // 🌊 زيارات منطقة الإسكندرية
      {
        name: "\u0645\u0637\u0639\u0645 \u0627\u0644\u0628\u0631\u0646\u0633 \u0644\u0644\u0645\u0623\u0643\u0648\u0644\u0627\u062A \u0627\u0644\u0628\u062D\u0631\u064A\u0629",
        owner_name: null,
        owner_phone: null,
        phone: "+201511223344",
        lat: 31.2001,
        // محطة الرمل - الإسكندرية
        lng: 29.9187,
        address: "\u0637\u0631\u064A\u0642 \u0627\u0644\u062C\u064A\u0634\u060C \u0645\u062D\u0637\u0629 \u0627\u0644\u0631\u0645\u0644\u060C \u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 - \u0628\u062C\u0648\u0627\u0631 \u0641\u0646\u062F\u0642 \u0633\u064A\u0633\u064A\u0644",
        notes: "\u0632\u064A\u0627\u0631\u0629 \u062A\u0631\u062D\u064A\u0628\u064A\u0629 \u0648\u062A\u0639\u0631\u064A\u0641\u064A\u0629 \u0628\u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u062C\u062F\u064A\u062F\u060C \u0627\u0644\u0639\u0645\u064A\u0644 \u0642\u064A\u062F \u0627\u0644\u062F\u0631\u0627\u0633\u0629 \u0648\u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0645\u0639 \u0627\u0644\u0645\u0646\u0627\u0641\u0633\u064A\u0646.",
        status: "visit",
        status_id: statusPendingId
      },
      {
        name: "\u0634\u0631\u0643\u0629 \u0637\u064A\u0628\u0629 \u0644\u0644\u0627\u0633\u062A\u064A\u0631\u0627\u062F \u0648\u0627\u0644\u062A\u0635\u062F\u064A\u0631",
        owner_name: "\u0637\u0627\u0631\u0642 \u0633\u0644\u064A\u0645",
        owner_phone: "+201088776655",
        phone: "+201022334455",
        lat: 31.2241,
        // سموحة - الإسكندرية
        lng: 29.9548,
        address: "\u0627\u0628\u0631\u0627\u062C \u062C\u0631\u064A\u0646 \u0628\u0644\u0627\u0632\u0627\u060C \u0633\u0645\u0648\u062D\u0629\u060C \u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629",
        notes: "\u0627\u0644\u0632\u064A\u0627\u0631\u0629 \u0623\u0633\u0641\u0631\u062A \u0639\u0646 \u0627\u062A\u0641\u0627\u0642 \u062A\u0648\u0631\u064A\u062F \u0623\u062C\u0647\u0632\u0629 \u0645\u0643\u062A\u0628\u064A\u0629\u060C \u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 \u0648\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0637\u0644\u0628 \u0644\u0644\u0642\u0633\u0645 \u0627\u0644\u0645\u0627\u0644\u064A.",
        status: "sales",
        status_id: statusInterestedId
      },
      {
        name: "\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629",
        owner_name: "\u0633\u0627\u0645\u062D \u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646",
        owner_phone: "+201288776655",
        phone: "+201222334455",
        lat: 31.2089,
        // الأزاريطة - الإسكندرية
        lng: 29.9092,
        address: "\u0634\u0627\u0631\u0639 \u0628\u0648\u0631\u0633\u0639\u064A\u062F\u060C \u0627\u0644\u0634\u0627\u0637\u0628\u064A\u060C \u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629",
        notes: "\u0627\u0644\u0639\u0645\u064A\u0644 \u0627\u0633\u062A\u0644\u0645 \u0627\u0644\u0634\u062D\u0646\u0629 \u0643\u0627\u0645\u0644\u0629 \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0648\u062A\u0645 \u0627\u0644\u062A\u0648\u0642\u064A\u0639 \u0639\u0644\u0649 \u0633\u0646\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0628\u0646\u062C\u0627\u062D.",
        status: "delivered",
        status_id: statusDoneId
      },
      // 🌾 زيارات مناطق الدلتا (المنصورة)
      {
        name: "\u0645\u0633\u062A\u0634\u0641\u0649 \u0627\u0644\u062F\u0644\u062A\u0627 \u0627\u0644\u062A\u062E\u0635\u0635\u064A",
        owner_name: "\u062F. \u0625\u0628\u0631\u0627\u0647\u064A\u0645 \u064A\u0648\u0633\u0641",
        owner_phone: "+201188776655",
        phone: "+201122334455",
        lat: 31.0413,
        // المنصورة
        lng: 31.3785,
        address: "\u0634\u0627\u0631\u0639 \u0627\u0644\u0645\u0634\u0627\u064A\u0629 \u0627\u0644\u0633\u0641\u0644\u064A\u0629\u060C \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629\u060C \u0627\u0644\u062F\u0642\u0647\u0644\u064A\u0629",
        notes: "\u0627\u0644\u0639\u0645\u064A\u0644 \u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0639\u0631\u0636 \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0641\u0646\u064A \u0648\u0627\u0644\u0645\u0627\u0644\u064A \u0645\u0639 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0637\u0628\u064A\u0629 \u0627\u0644\u0639\u0644\u064A\u0627\u060C \u0633\u064A\u062A\u0645 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0645\u0637\u0644\u0639 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u0627\u0644\u0645\u0642\u0628\u0644.",
        status: "visit",
        status_id: statusPendingId
      },
      {
        name: "\u0645\u062D\u0644\u0627\u062A \u0627\u0644\u0647\u062F\u0649 \u0644\u0644\u0645\u0644\u0627\u0628\u0633 \u0627\u0644\u062C\u0627\u0647\u0632\u0629",
        owner_name: "\u0645\u062D\u0645\u0648\u062F \u0627\u0644\u0634\u0631\u0628\u064A\u0646\u064A",
        owner_phone: "+201588776655",
        phone: "+201522334455",
        lat: 31.0361,
        // السكة الجديدة - المنصورة
        lng: 31.3892,
        address: "\u0634\u0627\u0631\u0639 \u0627\u0644\u0633\u0643\u0629 \u0627\u0644\u062C\u062F\u064A\u062F\u0629\u060C \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u0629\u060C \u0627\u0644\u062F\u0642\u0647\u0644\u064A\u0629",
        notes: "\u062A\u0645 \u0627\u0644\u0627\u062A\u0641\u0627\u0642 \u0648\u0625\u0628\u0631\u0627\u0645 \u0627\u0644\u0635\u0641\u0642\u0629 \u0648\u062A\u0648\u0631\u064A\u062F \u0627\u0644\u062F\u0641\u0639\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0648\u062C\u0627\u0631\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0644\u0644\u0645\u0648\u0633\u0645 \u0627\u0644\u062C\u062F\u064A\u062F.",
        status: "sales",
        status_id: statusInterestedId
      }
    ];
    console.log("   \u{1F4E5} Saving visits...");
    await import_db.db.insert(import_schema.visits).values(visitsData);
    console.log(`   \u{1F680} Completed! Seeded ${visitsData.length} visits across Cairo, Alexandria, and Mansoura.`);
  },
  async rollback() {
    console.log("   \u{1F5D1}\uFE0F Rolling back seeded visits...");
    await import_db.db.delete(import_schema.visits).where(
      import_drizzle_orm.sql`id LIKE 'v1111111%' OR id LIKE 'v2222222%' OR id LIKE 'v3333333%' OR id LIKE 'v4444444%' OR id LIKE 'v5555555%' OR id LIKE 'v6666666%' OR id LIKE 'v7777777%' OR id LIKE 'v8888888%'`
    );
    console.log("   \u2705 Rollback completed successfully.");
  }
};
var stdin_default = seed;
