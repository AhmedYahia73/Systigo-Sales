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
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
var import_express = require("express");
var import_wishlist = require("../../controllers/admin/wishlist");
var import_catchAsync = require("../../utils/catchAsync");
var import_checkpermission = require("../../middlewares/checkpermission");
const router = (0, import_express.Router)();
router.get("/", (0, import_checkpermission.checkAdminLeaderSales)(), (0, import_catchAsync.catchAsync)(import_wishlist.getAllWishLists));
router.get("/lists", (0, import_checkpermission.checkAdminLeaderSales)(), (0, import_catchAsync.catchAsync)(import_wishlist.lists));
router.post("/:id/convert", (0, import_checkpermission.checkAdminLeaderSales)(), (0, import_catchAsync.catchAsync)(import_wishlist.convertWishListToVisit));
router.post("/convert/:id", (0, import_checkpermission.checkAdminLeaderSales)(), (0, import_catchAsync.catchAsync)(import_wishlist.convertWishListToVisit));
router.get("/:id", (0, import_checkpermission.checkAdminLeaderSales)(), (0, import_catchAsync.catchAsync)(import_wishlist.getWishListsById));
router.post("/", (0, import_checkpermission.checkAdminLeaderSales)(), (0, import_catchAsync.catchAsync)(import_wishlist.createWishLists));
router.put("/:id", (0, import_checkpermission.checkAdminLeaderSales)(), (0, import_catchAsync.catchAsync)(import_wishlist.updateWishLists));
router.delete("/:id", (0, import_checkpermission.checkAdminLeaderSales)(), (0, import_catchAsync.catchAsync)(import_wishlist.deleteWishLists));
var stdin_default = router;
