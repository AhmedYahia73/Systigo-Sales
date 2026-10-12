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
var import_statusRequests = require("../../controllers/admin/statusRequests");
var import_catchAsync = require("../../utils/catchAsync");
var import_checkpermission = require("../../middlewares/checkpermission");
const router = (0, import_express.Router)();
router.get("/pending", (0, import_checkpermission.checkAdminLeader)(), (0, import_catchAsync.catchAsync)(import_statusRequests.getPendingRequest));
router.get("/history", (0, import_checkpermission.checkAdminLeader)(), (0, import_catchAsync.catchAsync)(import_statusRequests.getHistoryRequest));
router.put("/status/:id", (0, import_checkpermission.checkAdminLeader)(), (0, import_catchAsync.catchAsync)(import_statusRequests.changeStatus));
var stdin_default = router;
