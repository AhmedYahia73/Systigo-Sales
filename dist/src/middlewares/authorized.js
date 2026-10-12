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
  authorizeRoles: () => authorizeRoles
});
module.exports = __toCommonJS(stdin_exports);
var import_Errors = require("../Errors");
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new import_Errors.UnauthorizedError("Not authenticated");
    }
    if (!roles.includes(req.user.role)) {
      throw new import_Errors.UnauthorizedError("You don't have permission to access this resource");
    }
    next();
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authorizeRoles
});
