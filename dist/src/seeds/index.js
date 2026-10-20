"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seeds = void 0;
// Auto-discover and register all seed files
// Import all seed files in order
const _01_admin_1 = __importDefault(require("./data/01_admin"));
const _02_default_targets_1 = __importDefault(require("./data/02_default_targets"));
const _03_default_visits_1 = __importDefault(require("./data/03_default_visits"));
const _04_default_visit_status_1 = __importDefault(require("./data/04_default_visit_status"));
const _05_default_wishlist_1 = __importDefault(require("./data/05_default_wishlist"));
// Export all seeds in execution order
exports.seeds = [
    _02_default_targets_1.default,
    _01_admin_1.default,
    _04_default_visit_status_1.default,
    _03_default_visits_1.default,
    _05_default_wishlist_1.default,
];
// Run seeds when this file is executed directly
const runner_1 = require("./runner");
const isFresh = process.argv.includes("--fresh");
(0, runner_1.runSeeds)(exports.seeds, { fresh: isFresh })
    .then(() => {
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
})
    .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});
