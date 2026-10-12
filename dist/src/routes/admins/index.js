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
var import_authenticated = require("../../middlewares/authenticated");
var import_authorized = require("../../middlewares/authorized");
var import_catchAsync = require("../../utils/catchAsync");
var import_auth = __toESM(require("./auth"));
var import_admin = __toESM(require("./admin"));
var import_leader = __toESM(require("./leader"));
var import_sales = __toESM(require("./sales"));
var import_status = __toESM(require("./status"));
var import_target = __toESM(require("./target"));
var import_visits = __toESM(require("./visits"));
var import_wishList = __toESM(require("./wishList"));
var import_dashboard = __toESM(require("./dashboard"));
var import_requests = __toESM(require("./requests"));
var import_products = __toESM(require("./products"));
var import_leads = __toESM(require("./leads"));
var import_express = require("express");
const route = (0, import_express.Router)();
route.use("/auth", (0, import_catchAsync.catchAsync)(import_auth.default));
route.use(import_authenticated.authenticated, (0, import_authorized.authorizeRoles)("admin", "leader", "sales"));
route.use("/leader", (0, import_catchAsync.catchAsync)(import_leader.default));
route.use("/sales", (0, import_catchAsync.catchAsync)(import_sales.default));
route.use("/visit_status", (0, import_catchAsync.catchAsync)(import_status.default));
route.use("/target", (0, import_catchAsync.catchAsync)(import_target.default));
route.use("/admins", (0, import_catchAsync.catchAsync)(import_admin.default));
route.use("/visits", (0, import_catchAsync.catchAsync)(import_visits.default));
route.use("/wish_list", (0, import_catchAsync.catchAsync)(import_wishList.default));
route.use("/dashboard", (0, import_catchAsync.catchAsync)(import_dashboard.default));
route.use("/status_requests", (0, import_catchAsync.catchAsync)(import_requests.default));
route.use("/products", (0, import_catchAsync.catchAsync)(import_products.default));
route.use("/leads", (0, import_catchAsync.catchAsync)(import_leads.default));
var stdin_default = route;
