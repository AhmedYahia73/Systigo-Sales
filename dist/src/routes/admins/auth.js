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
var import_express = require("express");
var import_auth = require("../../controllers/auth/auth");
var import_catchAsync = require("../../utils/catchAsync");
var import_validation = require("../../middlewares/validation");
var import_auth2 = require("../../validators/auth");
const route = (0, import_express.Router)();
route.post("/login", (0, import_validation.validate)(import_auth2.loginSchema), (0, import_catchAsync.catchAsync)(import_auth.login));
route.post("/hash_password", (0, import_validation.validate)(import_auth2.hashPasswordSchema), (0, import_catchAsync.catchAsync)(import_auth.hash_password));
var stdin_default = route;
