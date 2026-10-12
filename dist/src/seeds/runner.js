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
  rollbackSeeds: () => rollbackSeeds,
  runSeeds: () => runSeeds
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../models/db");
var import_drizzle_orm = require("drizzle-orm");
async function ensureSeedHistoryTable() {
  await import_db.db.execute(import_drizzle_orm.sql`
    CREATE TABLE IF NOT EXISTS seed_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
async function getExecutedSeeds() {
  const result = await import_db.db.execute(import_drizzle_orm.sql`SELECT name FROM seed_history`);
  const rows = result[0];
  return rows.map((row) => row.name);
}
async function markSeedAsExecuted(name) {
  await import_db.db.execute(import_drizzle_orm.sql`INSERT INTO seed_history (name) VALUES (${name})`);
}
async function clearSeedHistory() {
  await import_db.db.execute(import_drizzle_orm.sql`DELETE FROM seed_history`);
}
async function runSeeds(seeds, options = {}) {
  const { fresh = false } = options;
  console.log("\u{1F331} Starting database seeding...\n");
  try {
    await ensureSeedHistoryTable();
    if (fresh) {
      console.log("\u{1F504} Fresh mode enabled - clearing seed history...\n");
      await clearSeedHistory();
    }
    const executedSeeds = await getExecutedSeeds();
    const pendingSeeds = seeds.filter(
      (seed) => !executedSeeds.includes(seed.name)
    );
    if (pendingSeeds.length === 0) {
      console.log("\u2728 All seeds have already been executed. Nothing to do.\n");
      return;
    }
    console.log(`\u{1F4CB} Found ${pendingSeeds.length} pending seed(s) to run:
`);
    pendingSeeds.forEach((seed, index) => {
      console.log(`   ${index + 1}. ${seed.name}`);
    });
    console.log("");
    for (const seed of pendingSeeds) {
      console.log(`\u25B6\uFE0F  Running seed: ${seed.name}...`);
      try {
        await seed.run();
        await markSeedAsExecuted(seed.name);
        console.log(`   \u2705 ${seed.name} completed
`);
      } catch (error) {
        console.error(`   \u274C ${seed.name} failed:`, error);
        throw error;
      }
    }
    console.log("\u{1F389} All seeds executed successfully!\n");
  } finally {
    await import_db.pool.end();
  }
}
async function rollbackSeeds(seeds) {
  console.log("\u23EA Rolling back seeds...\n");
  try {
    await ensureSeedHistoryTable();
    for (const seed of [...seeds].reverse()) {
      if (seed.rollback) {
        console.log(`\u23EA Rolling back: ${seed.name}...`);
        try {
          await seed.rollback();
          await import_db.db.execute(
            import_drizzle_orm.sql`DELETE FROM seed_history WHERE name = ${seed.name}`
          );
          console.log(`   \u2705 ${seed.name} rolled back
`);
        } catch (error) {
          console.error(`   \u274C ${seed.name} rollback failed:`, error);
          throw error;
        }
      }
    }
    console.log("\u2705 Rollback completed!\n");
  } finally {
    await import_db.pool.end();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  rollbackSeeds,
  runSeeds
});
