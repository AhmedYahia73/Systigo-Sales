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
  seeds: () => seeds
});
module.exports = __toCommonJS(stdin_exports);
var import_admin = __toESM(require("./data/01_admin"));
var import_default_targets = __toESM(require("./data/02_default_targets"));
var import_default_visits = __toESM(require("./data/03_default_visits"));
var import_default_visit_status = __toESM(require("./data/04_default_visit_status"));
var import_default_wishlist = __toESM(require("./data/05_default_wishlist"));
var import_runner2 = require("./runner");
const seeds = [
  import_default_targets.default,
  import_admin.default,
  import_default_visit_status.default,
  import_default_visits.default,
  import_default_wishlist.default
];
const isFresh = process.argv.includes("--fresh");
(0, import_runner2.runSeeds)(seeds, { fresh: isFresh }).then(() => {
  console.log("\u2705 Seeding completed successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("\u274C Seeding failed:", error);
  process.exit(1);
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  seeds
});
