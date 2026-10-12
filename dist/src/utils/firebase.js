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
  sendPushNotification: () => sendPushNotification
});
module.exports = __toCommonJS(stdin_exports);
var import_firebase_admin = __toESM(require("firebase-admin"));
if (!import_firebase_admin.default.apps.length) {
  import_firebase_admin.default.initializeApp({
    credential: import_firebase_admin.default.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    })
  });
}
const sendPushNotification = async (tokens, title, body, data) => {
  if (!tokens || tokens.length === 0) {
    console.log("[FCM] No tokens provided");
    return;
  }
  try {
    const message = {
      tokens,
      notification: {
        title,
        body
      },
      data: data || {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1
          }
        }
      }
    };
    const response = await import_firebase_admin.default.messaging().sendEachForMulticast(message);
    console.log(`[FCM] Success: ${response.successCount}, Failed: ${response.failureCount}`);
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.error(`[FCM] Failed to send to token ${idx}:`, resp.error);
      }
    });
  } catch (error) {
    console.error("[FCM] Error sending notification:", error);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  sendPushNotification
});
