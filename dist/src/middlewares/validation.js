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
  validate: () => validate
});
module.exports = __toCommonJS(stdin_exports);
var import_zod = require("zod");
var import_promises = __toESM(require("fs/promises"));
function gatherFiles(req) {
  const files = [];
  if (req.file) files.push(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      Object.values(req.files).flat().forEach((file) => {
        files.push(file);
      });
    }
  }
  return files;
}
const validate = (schema) => {
  const handler = async (req, res, next) => {
    try {
      const resolvedSchema = typeof schema === "function" ? schema(req.user?.role) : schema;
      await resolvedSchema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof import_zod.ZodError) {
        const files = gatherFiles(req);
        const deleteOps = files.map(
          (file) => file.path ? import_promises.default.unlink(file.path).catch(console.error) : Promise.resolve()
        );
        await Promise.all(deleteOps);
        throw error;
      }
      next(error);
    }
  };
  handler.__zodSchema = schema;
  return handler;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validate
});
