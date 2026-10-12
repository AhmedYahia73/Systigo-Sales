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
  checkAdminLeader: () => checkAdminLeader,
  checkAdminLeaderSales: () => checkAdminLeaderSales,
  checkOnlyAdmin: () => checkOnlyAdmin
});
module.exports = __toCommonJS(stdin_exports);
var import_Errors = require("../Errors");
const checkAdminLeader = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        throw new import_Errors.UnauthorizedError("Authentication required");
      }
      if (user.role === "admin" || user.role === "leader") {
        return next();
      }
      throw new import_Errors.ForbiddenError("You Must Login as Admin or Leader");
    } catch (error) {
      next(error);
    }
  };
};
const checkAdminLeaderSales = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        throw new import_Errors.UnauthorizedError("Authentication required");
      }
      if (user.role === "admin" || user.role === "leader" || user.role === "sales") {
        return next();
      }
      throw new import_Errors.ForbiddenError("You Must Login as Admin or Leader or Sales");
    } catch (error) {
      next(error);
    }
  };
};
const checkOnlyAdmin = () => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        throw new import_Errors.UnauthorizedError("Authentication required");
      }
      if (user.role === "admin") {
        return next();
      }
      throw new import_Errors.ForbiddenError("You Must Login as Admin");
    } catch (error) {
      next(error);
    }
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkAdminLeader,
  checkAdminLeaderSales,
  checkOnlyAdmin
});
