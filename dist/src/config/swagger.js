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
  getSwaggerSpec: () => getSwaggerSpec,
  setupSwagger: () => setupSwagger,
  zodFieldToOpenApi: () => zodFieldToOpenApi
});
module.exports = __toCommonJS(stdin_exports);
var import_swagger_jsdoc = __toESM(require("swagger-jsdoc"));
var import_swagger_ui_express = __toESM(require("swagger-ui-express"));
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var authValidators = __toESM(require("../validators/auth"));
var authController = __toESM(require("../controllers/auth/auth"));
var adminController = __toESM(require("../controllers/admin/admin"));
var leaderController = __toESM(require("../controllers/admin/leader"));
var salesController = __toESM(require("../controllers/admin/sales"));
var statusController = __toESM(require("../controllers/admin/status"));
var targetController = __toESM(require("../controllers/admin/target"));
var visitsController = __toESM(require("../controllers/admin/visits"));
var wishlistController = __toESM(require("../controllers/admin/wishlist"));
var dashboardController = __toESM(require("../controllers/admin/dashboard"));
var statusRequestsController = __toESM(require("../controllers/admin/statusRequests"));
var productsController = __toESM(require("../controllers/admin/products"));
var leadsController = __toESM(require("../controllers/admin/leads"));
var import_auth = __toESM(require("../routes/admins/auth"));
var import_admin = __toESM(require("../routes/admins/admin"));
var import_leader = __toESM(require("../routes/admins/leader"));
var import_sales = __toESM(require("../routes/admins/sales"));
var import_status = __toESM(require("../routes/admins/status"));
var import_target = __toESM(require("../routes/admins/target"));
var import_visits = __toESM(require("../routes/admins/visits"));
var import_wishList = __toESM(require("../routes/admins/wishList"));
var import_dashboard = __toESM(require("../routes/admins/dashboard"));
var import_requests = __toESM(require("../routes/admins/requests"));
var import_products = __toESM(require("../routes/admins/products"));
var import_leads = __toESM(require("../routes/admins/leads"));
function isZodSchema(val) {
  return Boolean(val && typeof val === "object" && val._def && typeof val.parseAsync === "function");
}
function resolveZodSchema(schemaOrFactory) {
  if (!schemaOrFactory) return null;
  if (isZodSchema(schemaOrFactory)) return schemaOrFactory;
  if (typeof schemaOrFactory === "function") {
    try {
      const result = schemaOrFactory();
      if (isZodSchema(result)) return result;
    } catch {
      return null;
    }
  }
  return null;
}
function getSmartExample(fieldName, openApiSchema) {
  if (openApiSchema.example !== void 0) return openApiSchema.example;
  if (openApiSchema.default !== void 0) return openApiSchema.default;
  if (Array.isArray(openApiSchema.enum) && openApiSchema.enum.length > 0) {
    return openApiSchema.enum[0];
  }
  const key = fieldName.toLowerCase();
  if (openApiSchema.format === "uuid" || key.endsWith("_id") || key === "id") {
    return "3fa85f64-5717-4562-b3fc-2c963f66afa6";
  }
  if (openApiSchema.format === "email" || key.includes("email")) {
    return "user@example.com";
  }
  if (key.includes("phone")) return "01012345678";
  if (key === "password") return "secret123";
  if (key === "lat") return 30.0444;
  if (key === "lng") return 31.2357;
  if (key === "year") return (/* @__PURE__ */ new Date()).getFullYear();
  if (key === "month") return (/* @__PURE__ */ new Date()).getMonth() + 1;
  if (key === "number" || key === "point" || key === "points") return 100;
  if (key === "feez") return 500;
  if (key === "duration") return "1 Year";
  if (key === "address") return "Cairo, Egypt";
  if (key === "name" || key.endsWith("_name")) return "Example Name";
  if (key === "description" || key === "notes") return "Sample notes";
  if (key === "demo_link") return "https://example.com/demo";
  return void 0;
}
function zodFieldToOpenApi(zodType, fieldName = "") {
  if (!zodType || !zodType._def) {
    return { schema: { type: "string" }, isOptional: true };
  }
  let current = zodType;
  let isOptional = false;
  let isNullable = false;
  let defaultValue = void 0;
  let description = current.description || current._def?.description;
  let safetyCounter = 0;
  while (current && current._def && safetyCounter < 20) {
    safetyCounter++;
    const typeName2 = current._def.typeName;
    if (!description && (current.description || current._def.description)) {
      description = current.description || current._def.description;
    }
    if (typeName2 === "ZodOptional") {
      isOptional = true;
      current = current._def.innerType;
    } else if (typeName2 === "ZodNullable") {
      isNullable = true;
      current = current._def.innerType;
    } else if (typeName2 === "ZodDefault") {
      isOptional = true;
      try {
        defaultValue = current._def.defaultValue();
      } catch {
      }
      current = current._def.innerType;
    } else if (typeName2 === "ZodEffects") {
      current = current._def.schema;
    } else if (typeName2 === "ZodBranded" || typeName2 === "ZodReadonly" || typeName2 === "ZodCatch") {
      current = current._def.innerType || current._def.type;
    } else if (typeName2 === "ZodPipeline") {
      current = current._def.in;
    } else {
      break;
    }
  }
  const typeName = current?._def?.typeName || "";
  let schema = {};
  switch (typeName) {
    case "ZodString": {
      schema = { type: "string" };
      const checks = current._def.checks || [];
      for (const check of checks) {
        if (check.kind === "email") schema.format = "email";
        else if (check.kind === "uuid") schema.format = "uuid";
        else if (check.kind === "url") schema.format = "uri";
        else if (check.kind === "datetime") schema.format = "date-time";
        else if (check.kind === "min") schema.minLength = check.value;
        else if (check.kind === "max") schema.maxLength = check.value;
      }
      break;
    }
    case "ZodNumber": {
      const checks = current._def.checks || [];
      const isInt = checks.some((c) => c.kind === "int");
      schema = { type: isInt ? "integer" : "number" };
      for (const check of checks) {
        if (check.kind === "min") schema.minimum = check.value;
        else if (check.kind === "max") schema.maximum = check.value;
      }
      break;
    }
    case "ZodBoolean": {
      schema = { type: "boolean", example: true };
      break;
    }
    case "ZodEnum": {
      const values = current._def.values || [];
      schema = {
        type: "string",
        enum: values
      };
      if (values.length > 0) schema.example = values[0];
      break;
    }
    case "ZodNativeEnum": {
      const values = Object.values(current._def.values || {});
      schema = {
        type: "string",
        enum: values
      };
      if (values.length > 0) schema.example = values[0];
      break;
    }
    case "ZodLiteral": {
      const val = current._def.value;
      schema = {
        type: typeof val === "number" ? "number" : typeof val === "boolean" ? "boolean" : "string",
        enum: [val],
        example: val
      };
      break;
    }
    case "ZodArray": {
      const itemConverted = zodFieldToOpenApi(current._def.type, fieldName.replace(/s$/, ""));
      schema = {
        type: "array",
        items: itemConverted.schema
      };
      if (current._def.minLength?.value !== void 0) {
        schema.minItems = current._def.minLength.value;
      }
      if (current._def.maxLength?.value !== void 0) {
        schema.maxItems = current._def.maxLength.value;
      }
      break;
    }
    case "ZodObject": {
      const rawShape = typeof current._def.shape === "function" ? current._def.shape() : current.shape || {};
      const properties = {};
      const required = [];
      for (const [key, propZod] of Object.entries(rawShape)) {
        const converted = zodFieldToOpenApi(propZod, key);
        properties[key] = converted.schema;
        if (!converted.isOptional) {
          required.push(key);
        }
      }
      schema = {
        type: "object",
        properties
      };
      if (required.length > 0) {
        schema.required = required;
      }
      break;
    }
    case "ZodUnion":
    case "ZodDiscriminatedUnion": {
      const options2 = current._def.options || [];
      schema = {
        oneOf: options2.map((opt) => zodFieldToOpenApi(opt, fieldName).schema)
      };
      break;
    }
    case "ZodRecord": {
      const valueConverted = zodFieldToOpenApi(current._def.valueType, fieldName);
      schema = {
        type: "object",
        additionalProperties: valueConverted.schema
      };
      break;
    }
    default: {
      schema = { type: "string" };
      break;
    }
  }
  if (isNullable) {
    schema.nullable = true;
  }
  if (defaultValue !== void 0) {
    schema.default = defaultValue;
  }
  if (description) {
    schema.description = description;
  }
  if (fieldName && schema.type !== "object" && schema.type !== "array") {
    const example = getSmartExample(fieldName, schema);
    if (example !== void 0 && schema.example === void 0) {
      schema.example = example;
    }
  }
  return { schema, isOptional, description };
}
const globalSchemaRegistry = /* @__PURE__ */ new Map();
const controllerSchemaMap = /* @__PURE__ */ new WeakMap();
function registerModuleExports(mod) {
  if (!mod || typeof mod !== "object") return;
  const localSchemas = /* @__PURE__ */ new Map();
  for (const [exportName, exportVal] of Object.entries(mod)) {
    const resolved = resolveZodSchema(exportVal);
    if (resolved) {
      localSchemas.set(exportName, exportVal);
      globalSchemaRegistry.set(exportName, exportVal);
    }
  }
  for (const [exportName, exportVal] of Object.entries(mod)) {
    if (typeof exportVal !== "function" || localSchemas.has(exportName)) continue;
    if (exportVal.__zodSchema) {
      controllerSchemaMap.set(exportVal, {
        schemaName: `${exportName}Schema`,
        schema: exportVal.__zodSchema
      });
      continue;
    }
    const fnSource = Function.prototype.toString.call(exportVal);
    let matchedKey;
    for (const [candidateName] of localSchemas.entries()) {
      const idRegex = new RegExp(`\\b${candidateName}\\b`);
      if (idRegex.test(fnSource)) {
        matchedKey = candidateName;
        break;
      }
    }
    if (!matchedKey) {
      for (const [candidateName] of globalSchemaRegistry.entries()) {
        const idRegex = new RegExp(`\\b${candidateName}\\b`);
        if (idRegex.test(fnSource)) {
          matchedKey = candidateName;
          break;
        }
      }
    }
    if (matchedKey) {
      const matchedSchema = localSchemas.get(matchedKey) || globalSchemaRegistry.get(matchedKey);
      if (matchedSchema) {
        controllerSchemaMap.set(exportVal, {
          schemaName: matchedKey,
          schema: matchedSchema
        });
      }
    }
  }
}
function initializeRegistries() {
  const staticModules = [
    authValidators,
    authController,
    adminController,
    leaderController,
    salesController,
    statusController,
    targetController,
    visitsController,
    wishlistController,
    dashboardController,
    statusRequestsController,
    productsController,
    leadsController
  ];
  for (const mod of staticModules) {
    registerModuleExports(mod);
  }
  const dirsToScan = [
    import_path.default.join(__dirname, "../validators"),
    import_path.default.join(__dirname, "../controllers/auth"),
    import_path.default.join(__dirname, "../controllers/admin")
  ];
  for (const dir of dirsToScan) {
    if (!import_fs.default.existsSync(dir)) continue;
    try {
      const files = import_fs.default.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
        if (file.endsWith(".d.ts")) continue;
        try {
          const dynamicMod = require(import_path.default.join(dir, file));
          registerModuleExports(dynamicMod);
        } catch {
        }
      }
    } catch {
    }
  }
}
const MOUNTED_ROUTERS = [
  {
    prefix: "/api/admin/auth",
    tag: "Auth",
    description: "Authentication endpoints",
    router: import_auth.default,
    requiresAuth: false
  },
  {
    prefix: "/api/admin/admins",
    tag: "Admins",
    description: "Admin management endpoints",
    router: import_admin.default,
    requiresAuth: true
  },
  {
    prefix: "/api/admin/leader",
    tag: "Leaders",
    description: "Leader management endpoints",
    router: import_leader.default,
    requiresAuth: true
  },
  {
    prefix: "/api/admin/sales",
    tag: "Sales",
    description: "Sales staff management endpoints",
    router: import_sales.default,
    requiresAuth: true
  },
  {
    prefix: "/api/admin/visit_status",
    tag: "Visit Status",
    description: "Visit status management endpoints",
    router: import_status.default,
    requiresAuth: true
  },
  {
    prefix: "/api/admin/target",
    tag: "Targets",
    description: "Target management endpoints",
    router: import_target.default,
    requiresAuth: true
  },
  {
    prefix: "/api/admin/visits",
    tag: "Visits",
    description: "Visits & Sales conversion endpoints",
    router: import_visits.default,
    requiresAuth: true
  },
  {
    prefix: "/api/admin/wish_list",
    tag: "Wish List",
    description: "Wish list management endpoints",
    router: import_wishList.default,
    requiresAuth: true
  },
  {
    prefix: "/api/admin/dashboard",
    tag: "Dashboard",
    description: "Dashboard statistics & analytics endpoints",
    router: import_dashboard.default,
    requiresAuth: true
  },
  {
    prefix: "/api/admin/status_requests",
    tag: "Status Requests",
    description: "Visit status change requests endpoints",
    router: import_requests.default,
    requiresAuth: true
  },
  {
    prefix: "/api/admin/products",
    tag: "Products",
    description: "Products & points configuration endpoints",
    router: import_products.default,
    requiresAuth: true
  },
  {
    prefix: "/api/admin/leads",
    tag: "Leads",
    description: "Leads management & conversion to visits endpoints",
    router: import_leads.default,
    requiresAuth: true
  }
];
function toOpenApiPath(expressPath) {
  return expressPath.replace(/\/+/g, "/").replace(/\/$/, "").replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
}
function humanizeSummary(method, fullPath, handlerName) {
  if (handlerName && handlerName !== "anonymous" && handlerName !== "wrapped") {
    const spaced = handlerName.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }
  return `${method.toUpperCase()} ${fullPath}`;
}
function formatSchemaComponentName(rawName, suffix) {
  const cleaned = rawName.replace(/^get/i, "").replace(/Schema$/i, "");
  const pascal = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return `${pascal}${suffix}`;
}
function getExportedSchemaName(schemaObj, fallbackHandlerName) {
  for (const [name, val] of globalSchemaRegistry.entries()) {
    if (val === schemaObj) return name;
  }
  if (fallbackHandlerName && fallbackHandlerName !== "handler" && fallbackHandlerName !== "wrapped") {
    return `${fallbackHandlerName}Schema`;
  }
  return "RequestSchema";
}
function findZodSchemaForRoute(routeStack) {
  let handlerName;
  let foundEntry = null;
  for (const layer of routeStack) {
    const rawHandle = layer?.handle;
    if (!rawHandle) continue;
    const originalFn = rawHandle.__originalFn || rawHandle;
    if (originalFn?.name && originalFn.name !== "handler" && originalFn.name !== "wrapped" && originalFn.name !== "anonymous") {
      handlerName = originalFn.name;
    }
    if (rawHandle.__zodSchema) {
      foundEntry = {
        schemaName: getExportedSchemaName(rawHandle.__zodSchema, handlerName),
        schema: rawHandle.__zodSchema
      };
    } else if (originalFn.__zodSchema) {
      foundEntry = {
        schemaName: getExportedSchemaName(originalFn.__zodSchema, handlerName),
        schema: originalFn.__zodSchema
      };
    } else if (controllerSchemaMap.has(originalFn)) {
      foundEntry = controllerSchemaMap.get(originalFn);
    } else if (typeof originalFn === "function") {
      const src = Function.prototype.toString.call(originalFn);
      for (const [candidateName, candidateSchema] of globalSchemaRegistry.entries()) {
        if (new RegExp(`\\b${candidateName}\\b`).test(src)) {
          foundEntry = {
            schemaName: candidateName,
            schema: candidateSchema
          };
          break;
        }
      }
    }
  }
  if (!foundEntry) {
    return handlerName ? { schemaName: "", zodObject: null, handlerName } : null;
  }
  const resolved = resolveZodSchema(foundEntry.schema);
  return {
    schemaName: foundEntry.schemaName === "RequestSchema" && handlerName ? `${handlerName}Schema` : foundEntry.schemaName,
    zodObject: resolved,
    handlerName
  };
}
function buildZodOpenApiSpec(baseSpec) {
  initializeRegistries();
  const paths = baseSpec.paths ? { ...baseSpec.paths } : {};
  const schemas = baseSpec.components?.schemas ? { ...baseSpec.components.schemas } : {};
  const tags = [];
  const seenTags = /* @__PURE__ */ new Set();
  for (const mount of MOUNTED_ROUTERS) {
    if (!seenTags.has(mount.tag)) {
      seenTags.add(mount.tag);
      tags.push({ name: mount.tag, description: mount.description });
    }
    const routerStack = mount.router?.stack || [];
    for (const layer of routerStack) {
      const route = layer?.route;
      if (!route) continue;
      const subPath = route.path === "/" ? "" : route.path;
      const openApiPath = toOpenApiPath(`${mount.prefix}${subPath}`);
      if (!paths[openApiPath]) {
        paths[openApiPath] = {};
      }
      const routeStack = route.stack || [];
      const methodsMap = /* @__PURE__ */ new Map();
      for (const item of routeStack) {
        const m = (item.method || "").toLowerCase();
        if (!m) continue;
        if (!methodsMap.has(m)) methodsMap.set(m, []);
        methodsMap.get(m).push(item);
      }
      for (const [method, methodLayers] of methodsMap.entries()) {
        const existingOp = paths[openApiPath][method] || {};
        const matched = findZodSchemaForRoute(methodLayers);
        const zodObj = matched?.zodObject;
        const rawTopShape = zodObj && zodObj._def ? typeof zodObj._def.shape === "function" ? zodObj._def.shape() : zodObj.shape || {} : null;
        let bodyZod = rawTopShape?.body;
        const paramsZod = rawTopShape?.params;
        const queryZod = rawTopShape?.query;
        if (rawTopShape && !bodyZod && !paramsZod && !queryZod && ["post", "put", "patch"].includes(method)) {
          bodyZod = zodObj;
        }
        const parameters = [];
        const paramNamesSeen = /* @__PURE__ */ new Set();
        if (paramsZod) {
          const convertedParams = zodFieldToOpenApi(paramsZod);
          const props = convertedParams.schema.properties || {};
          for (const [pKey, pSchema] of Object.entries(props)) {
            if (openApiPath.includes(`{${pKey}}`)) {
              paramNamesSeen.add(`path:${pKey}`);
              parameters.push({
                in: "path",
                name: pKey,
                required: true,
                schema: pSchema,
                description: pSchema.description || `${pKey} parameter`
              });
            } else {
              paramNamesSeen.add(`query:${pKey}`);
              parameters.push({
                in: "query",
                name: pKey,
                required: false,
                schema: pSchema,
                description: pSchema.description || `Filter by ${pKey}`
              });
            }
          }
        }
        const pathParamMatches = openApiPath.matchAll(/\{([a-zA-Z0-9_]+)\}/g);
        for (const pm of pathParamMatches) {
          const pName = pm[1];
          if (!paramNamesSeen.has(`path:${pName}`)) {
            paramNamesSeen.add(`path:${pName}`);
            parameters.push({
              in: "path",
              name: pName,
              required: true,
              schema: { type: "string" },
              description: `${pName} parameter`
            });
          }
        }
        if (queryZod) {
          const convertedQuery = zodFieldToOpenApi(queryZod);
          const props = convertedQuery.schema.properties || {};
          const reqList = convertedQuery.schema.required || [];
          for (const [qKey, qSchema] of Object.entries(props)) {
            paramNamesSeen.add(`query:${qKey}`);
            parameters.push({
              in: "query",
              name: qKey,
              required: reqList.includes(qKey),
              schema: qSchema,
              description: qSchema.description || `Filter by ${qKey}`
            });
          }
        }
        let requestBody = void 0;
        if (bodyZod && ["post", "put", "patch"].includes(method)) {
          const convertedBody = zodFieldToOpenApi(bodyZod);
          const componentName = matched?.schemaName ? formatSchemaComponentName(matched.schemaName, "Body") : void 0;
          if (componentName) {
            schemas[componentName] = convertedBody.schema;
          }
          requestBody = {
            required: !convertedBody.isOptional,
            content: {
              "application/json": {
                schema: convertedBody.schema
              }
            }
          };
        }
        const operation = {
          ...existingOp,
          tags: [mount.tag],
          summary: existingOp.summary || humanizeSummary(method, openApiPath, matched?.handlerName)
        };
        if (mount.requiresAuth) {
          operation.security = [{ bearerAuth: [] }];
        }
        if (parameters.length > 0) {
          operation.parameters = parameters;
        }
        if (requestBody) {
          operation.requestBody = requestBody;
        } else if (["get", "delete", "head"].includes(method)) {
          delete operation.requestBody;
        }
        if (!operation.responses) {
          operation.responses = {
            [method === "post" ? "201" : "200"]: {
              description: "Successful operation"
            },
            "400": {
              description: "Validation or Bad Request error"
            },
            ...mount.requiresAuth ? {
              "401": { description: "Unauthorized" },
              "403": { description: "Forbidden" }
            } : {}
          };
        }
        paths[openApiPath][method] = operation;
      }
    }
  }
  return {
    ...baseSpec,
    tags,
    paths,
    components: {
      ...baseSpec.components || {},
      securitySchemes: {
        ...baseSpec.components?.securitySchemes || {},
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas
    }
  };
}
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CRM API Documentation (Auto-Synced with Zod)",
      version: "1.0.0",
      description: "API documentation automatically generated and synchronized from Zod validation schemas and Express routes."
    },
    servers: [
      {
        url: "/",
        description: "Current Server (Auto)"
      },
      {
        url: "https://salesbacknd.systego.net",
        description: "Server (salesbacknd.systego.net)"
      },
      {
        url: "https://salesbcknd.food2go.online",
        description: "Production Server (food2go)"
      },
      {
        url: "http://localhost:3001",
        description: "Local Development Server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: [
    "./src/routes/**/*.ts",
    "./src/controllers/**/*.ts",
    "./dist/routes/**/*.js",
    "./dist/controllers/**/*.js"
  ]
};
const getSwaggerSpec = () => {
  let baseSpec = {
    openapi: "3.0.0",
    info: options.definition?.info,
    servers: options.definition?.servers,
    components: options.definition?.components,
    paths: {}
  };
  try {
    baseSpec = (0, import_swagger_jsdoc.default)(options);
  } catch (err) {
    console.warn("swaggerJSDoc fallback:", err);
  }
  return buildZodOpenApiSpec(baseSpec);
};
const setupSwagger = (app) => {
  const swaggerSpec = getSwaggerSpec();
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(getSwaggerSpec());
  });
  app.use(
    "/api-docs",
    import_swagger_ui_express.default.serve,
    import_swagger_ui_express.default.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list"
      }
    })
  );
  console.log("\u{1F4DD} Swagger documentation (Auto-Zod) is available at /api-docs");
};
