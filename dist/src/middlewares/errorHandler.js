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
  errorHandler: () => errorHandler
});
module.exports = __toCommonJS(stdin_exports);
var import_Errors = require("../Errors");
var import_http_status_codes = require("http-status-codes");
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
const errorHandler = (err, req, res, next) => {
  let statusCode = import_http_status_codes.StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";
  let details = err.message;
  if (err instanceof import_Errors.AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation failed";
    details = err.errors.map((error) => ({
      field: error.path.join("."),
      message: error.message
    }));
  } else if (err instanceof import_jsonwebtoken.default.JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token";
  } else if (err instanceof import_jsonwebtoken.default.TokenExpiredError) {
    statusCode = 401;
    message = "Token expired";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "The uploaded image is too large. Please upload a smaller image.";
    details = "Max request size exceeded. Limit is 10MB.";
  }
  const response = {
    success: false,
    error: {
      code: statusCode,
      message,
      details
    }
  };
  if (statusCode >= 500) {
    console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${err.stack || err}`);
    console.log(response);
  }
  res.status(statusCode).json(response);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  errorHandler
});
