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
  ACTION_NAMES: () => ACTION_NAMES,
  MODULES: () => MODULES,
  SUPER_ADMIN_ACTIONS: () => SUPER_ADMIN_ACTIONS,
  SUPER_ADMIN_MODULES: () => SUPER_ADMIN_MODULES
});
module.exports = __toCommonJS(stdin_exports);
const MODULES = [
  "admins",
  "roles",
  "bus_types",
  "buses",
  "drivers",
  "codrivers",
  "pickup_points",
  "routes",
  "departments",
  "rides",
  "notes",
  "students",
  "parents",
  "City",
  "Zone",
  "feeinstallments",
  "Subscription",
  "invoices",
  "organizationServices",
  "payments",
  "paymentMethods",
  "plans"
];
const ACTION_NAMES = ["View", "Add", "Edit", "Delete", "Status"];
const SUPER_ADMIN_MODULES = [
  "organizations",
  "plans",
  "payments",
  "subscriptions",
  "payment_methods",
  "promocodes",
  "parentplans",
  "sub_admins",
  "super_admin_roles",
  "type_organizations",
  "invoices",
  "installments",
  "wallets",
  "profile",
  "notes"
];
const SUPER_ADMIN_ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
  "status"
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ACTION_NAMES,
  MODULES,
  SUPER_ADMIN_ACTIONS,
  SUPER_ADMIN_MODULES
});
