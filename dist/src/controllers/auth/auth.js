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
  hash_password: () => hash_password,
  login: () => login
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_drizzle_orm = require("drizzle-orm");
var import_bcrypt = __toESM(require("bcrypt"));
var import_auth = require("../../utils/auth");
var import_Errors = require("../../Errors");
var import_response = require("../../utils/response");
async function login(req, res) {
  const { email, password } = req.body;
  const admin = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.eq)(import_schema.users.email, email)).limit(1);
  if (!admin[0]) {
    throw new import_Errors.UnauthorizedError("Invalid email or password");
  }
  const match = await import_bcrypt.default.compare(password, admin[0].password);
  if (!match) {
    throw new import_Errors.UnauthorizedError("Invalid email or password");
  }
  if (admin[0].status !== "active") {
    throw new import_Errors.UnauthorizedError("Your account is inactive");
  }
  const tokenPayload = {
    id: admin[0].id,
    role: admin[0].role,
    email: admin[0].email,
    name: admin[0].name,
    phone: admin[0].phone
  };
  const token = (0, import_auth.generateUserToken)(tokenPayload);
  return (0, import_response.SuccessResponse)(
    res,
    {
      message: "Login successful",
      token,
      user: {
        id: admin[0].id,
        name: admin[0].name,
        email: admin[0].email,
        phone: admin[0].phone,
        role: admin[0].role
      }
    },
    200
  );
}
async function hash_password(req, res) {
  const { password } = req.body;
  return (0, import_response.SuccessResponse)(
    res,
    {
      password: await import_bcrypt.default.hash(password, 10)
    },
    200
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  hash_password,
  login
});
