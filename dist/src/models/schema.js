var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
module.exports = __toCommonJS(stdin_exports);
__reExport(stdin_exports, require("./superadmin/targets"), module.exports);
__reExport(stdin_exports, require("./superadmin/visitStatus"), module.exports);
__reExport(stdin_exports, require("./superadmin/users"), module.exports);
__reExport(stdin_exports, require("./superadmin/visits"), module.exports);
__reExport(stdin_exports, require("./superadmin/wishList"), module.exports);
__reExport(stdin_exports, require("./superadmin/target_items"), module.exports);
__reExport(stdin_exports, require("./superadmin/target_sales"), module.exports);
__reExport(stdin_exports, require("./superadmin/statusRequest"), module.exports);
__reExport(stdin_exports, require("./superadmin/products"), module.exports);
__reExport(stdin_exports, require("./superadmin/leads"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./superadmin/targets"),
  ...require("./superadmin/visitStatus"),
  ...require("./superadmin/users"),
  ...require("./superadmin/visits"),
  ...require("./superadmin/wishList"),
  ...require("./superadmin/target_items"),
  ...require("./superadmin/target_sales"),
  ...require("./superadmin/statusRequest"),
  ...require("./superadmin/products"),
  ...require("./superadmin/leads")
});
