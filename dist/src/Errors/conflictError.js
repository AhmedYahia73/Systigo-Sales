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
  ConflictError: () => ConflictError
});
module.exports = __toCommonJS(stdin_exports);
var import_appError = require("./appError");
var import_http_status_codes = require("http-status-codes");
class ConflictError extends import_appError.AppError {
  constructor(message = "Resource Conflict", details) {
    super(message, import_http_status_codes.StatusCodes.CONFLICT, details);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConflictError
});
