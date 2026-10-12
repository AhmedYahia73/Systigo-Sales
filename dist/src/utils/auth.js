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
  generateAdminToken: () => generateAdminToken,
  generateLeaderToken: () => generateLeaderToken,
  generateSalesToken: () => generateSalesToken,
  generateUserToken: () => generateUserToken,
  verifyToken: () => verifyToken
});
module.exports = __toCommonJS(stdin_exports);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_Errors = require("../Errors");
var import_config = require("dotenv/config");
const JWT_SECRET = process.env.JWT_SECRET;
const generateAdminToken = (data) => {
  const payload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: "admin"
  };
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
const generateLeaderToken = (data) => {
  const payload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: "leader"
  };
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
const generateSalesToken = (data) => {
  const payload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: "sales"
  };
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
const generateUserToken = (data) => {
  const payload = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role
  };
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
const verifyToken = (token) => {
  try {
    return import_jsonwebtoken.default.verify(token, JWT_SECRET);
  } catch (error) {
    throw new import_Errors.UnauthorizedError("Invalid token");
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateAdminToken,
  generateLeaderToken,
  generateSalesToken,
  generateUserToken,
  verifyToken
});
