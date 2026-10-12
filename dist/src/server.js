var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var import_express = __toESM(require("express"));
var import_path = __toESM(require("path"));
var import_routes = __toESM(require("./routes"));
var import_errorHandler = require("./middlewares/errorHandler");
var import_Errors = require("./Errors");
var import_dotenv = __toESM(require("dotenv"));
var import_cors = __toESM(require("cors"));
var import_cookie_parser = __toESM(require("cookie-parser"));
var import_helmet = __toESM(require("helmet"));
var import_http = __toESM(require("http"));
var import_socket = require("socket.io");
var import_swagger = require("./config/swagger");
import_dotenv.default.config();
const app = (0, import_express.default)();
const httpServer = import_http.default.createServer(app);
const io = new import_socket.Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.use((0, import_cors.default)({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(
  (0, import_helmet.default)({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
  })
);
app.use((0, import_cookie_parser.default)());
app.use(import_express.default.json({ limit: "20mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", import_express.default.static(import_path.default.join(__dirname, "../uploads")));
(0, import_swagger.setupSwagger)(app);
app.get("/api/test", (req, res, next) => {
  res.json({ message: "API is working! notify token" });
});
app.use("/api", import_routes.default);
app.use((req, res, next) => {
  throw new import_Errors.NotFound("Route not found");
});
app.use(import_errorHandler.errorHandler);
httpServer.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
