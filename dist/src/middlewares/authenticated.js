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
  authenticated: () => authenticated
});
module.exports = __toCommonJS(stdin_exports);
var import_auth = require("../utils/auth");
var import_Errors = require("../Errors");
const authenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new import_Errors.UnauthorizedError("No token provided");
  }
  const token = authHeader.split(" ")[1];
  const decoded = (0, import_auth.verifyToken)(token);
  req.user = decoded;
  next();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authenticated
});
