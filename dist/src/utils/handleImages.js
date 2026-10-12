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
  saveBase64Image: () => saveBase64Image
});
module.exports = __toCommonJS(stdin_exports);
var import_path = __toESM(require("path"));
var import_promises = __toESM(require("fs/promises"));
var import_uuid = require("uuid");
async function saveBase64Image(req, base64, folder) {
  const matches = base64.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 format");
  }
  const mimeType = matches[1];
  const ext = mimeType.split("/")[1] || "png";
  const buffer = Buffer.from(matches[2], "base64");
  const fileName = `${(0, import_uuid.v4)()}.${ext}`;
  const uploadsDir = import_path.default.join(__dirname, "../..", "uploads", folder);
  await import_promises.default.mkdir(uploadsDir, { recursive: true });
  const filePath = import_path.default.join(uploadsDir, fileName);
  await import_promises.default.writeFile(filePath, buffer);
  const relativePath = `uploads/${folder}/${fileName}`;
  const imageUrl = `${req.protocol}://${req.get("host")}/${relativePath}`;
  return { url: imageUrl, relativePath };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  saveBase64Image
});
