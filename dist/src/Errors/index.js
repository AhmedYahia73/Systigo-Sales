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
  AppError: () => import_appError.AppError,
  ConflictError: () => import_conflictError.ConflictError,
  DatabaseError: () => import_databaseError.DatabaseError,
  ForbiddenError: () => import_forbiddenError.ForbiddenError,
  ForeignKeyConstrainError: () => import_foreignKeyConstrainError.ForeignKeyConstrainError,
  NotFound: () => import_NotFound.NotFound,
  NotNullConstrainError: () => import_notNullConstrainError.NotNullConstrainError,
  UnauthorizedError: () => import_unauthorizedError.UnauthorizedError,
  UniqueConstrainError: () => import_uniqueConstrainError.UniqueConstrainError,
  ValidationError: () => import_validationError.ValidationError
});
module.exports = __toCommonJS(stdin_exports);
var import_NotFound = require("./NotFound");
var import_validationError = require("./validationError");
var import_conflictError = require("./conflictError");
var import_forbiddenError = require("./forbiddenError");
var import_appError = require("./appError");
var import_databaseError = require("./databaseError");
var import_foreignKeyConstrainError = require("./foreignKeyConstrainError");
var import_notNullConstrainError = require("./notNullConstrainError");
var import_uniqueConstrainError = require("./uniqueConstrainError");
var import_unauthorizedError = require("./unauthorizedError");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AppError,
  ConflictError,
  DatabaseError,
  ForbiddenError,
  ForeignKeyConstrainError,
  NotFound,
  NotNullConstrainError,
  UnauthorizedError,
  UniqueConstrainError,
  ValidationError
});
