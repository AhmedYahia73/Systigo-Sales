// src/config/swagger.ts

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import fs from "fs";
import path from "path";

// Controllers & Validators (imported for automatic Zod schema & handler introspection)
import * as authValidators from "../validators/auth";
import * as authController from "../controllers/auth/auth";
import * as adminController from "../controllers/admin/admin";
import * as leaderController from "../controllers/admin/leader";
import * as salesController from "../controllers/admin/sales";
import * as statusController from "../controllers/admin/status";
import * as targetController from "../controllers/admin/target";
import * as visitsController from "../controllers/admin/visits";
import * as wishlistController from "../controllers/admin/wishlist";
import * as dashboardController from "../controllers/admin/dashboard";
import * as statusRequestsController from "../controllers/admin/statusRequests";
import * as productsController from "../controllers/admin/products";
import * as leadsController from "../controllers/admin/leads";

// Routers (imported for automatic Express route stack introspection)
import authRouter from "../routes/admins/auth";
import adminRouter from "../routes/admins/admin";
import leaderRouter from "../routes/admins/leader";
import salesRouter from "../routes/admins/sales";
import statusRouter from "../routes/admins/status";
import targetRouter from "../routes/admins/target";
import visitsRouter from "../routes/admins/visits";
import wishListRouter from "../routes/admins/wishList";
import dashboardRouter from "../routes/admins/dashboard";
import requestsRouter from "../routes/admins/requests";
import productsRouter from "../routes/admins/products";
import leadsRouter from "../routes/admins/leads";

// ==========================================
// 🔍 1. Zod-to-OpenAPI 3.0 Schema Introspector
// ==========================================

interface ConvertedZodField {
  schema: Record<string, any>;
  isOptional: boolean;
  description?: string;
}

function isZodSchema(val: any): boolean {
  return Boolean(val && typeof val === "object" && val._def && typeof val.parseAsync === "function");
}

function resolveZodSchema(schemaOrFactory: any, nameHint = ""): any {
  if (!schemaOrFactory) return null;
  if (isZodSchema(schemaOrFactory)) return schemaOrFactory;
  if (typeof schemaOrFactory === "function") {
    if (schemaOrFactory.__originalFn) return null;
    if (schemaOrFactory.constructor?.name === "AsyncFunction") return null;
    const fnName = nameHint || schemaOrFactory.name || "";
    if (!/schema$/i.test(fnName)) return null;
    if (schemaOrFactory.length > 1) return null;
    try {
      const result = schemaOrFactory();
      if (result && typeof result.then === "function") {
        result.catch?.(() => {});
        return null;
      }
      if (isZodSchema(result)) return result;
    } catch {
      return null;
    }
  }
  return null;
}

function getSmartExample(fieldName: string, openApiSchema: Record<string, any>): any {
  if (openApiSchema.example !== undefined) return openApiSchema.example;
  if (openApiSchema.default !== undefined) return openApiSchema.default;
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
  if (key === "year") return new Date().getFullYear();
  if (key === "month") return new Date().getMonth() + 1;
  if (key === "number" || key === "point" || key === "points") return 100;
  if (key === "feez") return 500;
  if (key === "duration") return "1 Year";
  if (key === "address") return "Cairo, Egypt";
  if (key === "name" || key.endsWith("_name")) return "Example Name";
  if (key === "description" || key === "notes") return "Sample notes";
  if (key === "demo_link") return "https://example.com/demo";
  return undefined;
}

export function zodFieldToOpenApi(zodType: any, fieldName = ""): ConvertedZodField {
  if (!zodType || !zodType._def) {
    return { schema: { type: "string" }, isOptional: true };
  }

  let current = zodType;
  let isOptional = false;
  let isNullable = false;
  let defaultValue: any = undefined;
  let description: string | undefined = current.description || current._def?.description;

  // Unwrap wrapper types (Optional, Nullable, Default, Effects, Branded, Readonly, Catch, Pipeline)
  let safetyCounter = 0;
  while (current && current._def && safetyCounter < 20) {
    safetyCounter++;
    const typeName: string = current._def.typeName;
    if (!description && (current.description || current._def.description)) {
      description = current.description || current._def.description;
    }

    if (typeName === "ZodOptional") {
      isOptional = true;
      current = current._def.innerType;
    } else if (typeName === "ZodNullable") {
      isNullable = true;
      current = current._def.innerType;
    } else if (typeName === "ZodDefault") {
      isOptional = true;
      try {
        defaultValue = current._def.defaultValue();
      } catch {
        // ignore
      }
      current = current._def.innerType;
    } else if (typeName === "ZodEffects") {
      current = current._def.schema;
    } else if (typeName === "ZodBranded" || typeName === "ZodReadonly" || typeName === "ZodCatch") {
      current = current._def.innerType || current._def.type;
    } else if (typeName === "ZodPipeline") {
      current = current._def.in;
    } else {
      break;
    }
  }

  const typeName: string = current?._def?.typeName || "";
  let schema: Record<string, any> = {};

  switch (typeName) {
    case "ZodString": {
      schema = { type: "string" };
      const checks: any[] = current._def.checks || [];
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
      const checks: any[] = current._def.checks || [];
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
        enum: values,
      };
      if (values.length > 0) schema.example = values[0];
      break;
    }

    case "ZodNativeEnum": {
      const values = Object.values(current._def.values || {});
      schema = {
        type: "string",
        enum: values,
      };
      if (values.length > 0) schema.example = values[0];
      break;
    }

    case "ZodLiteral": {
      const val = current._def.value;
      schema = {
        type: typeof val === "number" ? "number" : typeof val === "boolean" ? "boolean" : "string",
        enum: [val],
        example: val,
      };
      break;
    }

    case "ZodArray": {
      const itemConverted = zodFieldToOpenApi(current._def.type, fieldName.replace(/s$/, ""));
      schema = {
        type: "array",
        items: itemConverted.schema,
      };
      if (current._def.minLength?.value !== undefined) {
        schema.minItems = current._def.minLength.value;
      }
      if (current._def.maxLength?.value !== undefined) {
        schema.maxItems = current._def.maxLength.value;
      }
      break;
    }

    case "ZodObject": {
      const rawShape =
        typeof current._def.shape === "function"
          ? current._def.shape()
          : current.shape || {};
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, propZod] of Object.entries(rawShape)) {
        const converted = zodFieldToOpenApi(propZod, key);
        properties[key] = converted.schema;
        if (!converted.isOptional) {
          required.push(key);
        }
      }

      schema = {
        type: "object",
        properties,
      };
      if (required.length > 0) {
        schema.required = required;
      }
      break;
    }

    case "ZodUnion":
    case "ZodDiscriminatedUnion": {
      const options: any[] = current._def.options || [];
      schema = {
        oneOf: options.map((opt) => zodFieldToOpenApi(opt, fieldName).schema),
      };
      break;
    }

    case "ZodRecord": {
      const valueConverted = zodFieldToOpenApi(current._def.valueType, fieldName);
      schema = {
        type: "object",
        additionalProperties: valueConverted.schema,
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
  if (defaultValue !== undefined) {
    schema.default = defaultValue;
  }
  if (description) {
    schema.description = description;
  }

  if (fieldName && schema.type !== "object" && schema.type !== "array") {
    const example = getSmartExample(fieldName, schema);
    if (example !== undefined && schema.example === undefined) {
      schema.example = example;
    }
  }

  return { schema, isOptional, description };
}

// ==========================================
// 🔗 2. Automatic Controller & Schema Registry
// ==========================================

const globalSchemaRegistry = new Map<string, any>();
const controllerSchemaMap = new WeakMap<Function, { schemaName: string; schema: any }>();

function registerModuleExports(mod: Record<string, any>) {
  if (!mod || typeof mod !== "object") return;

  const localSchemas = new Map<string, any>();

  // 1. Collect all exported Zod schemas or schema factory functions in this module
  for (const [exportName, exportVal] of Object.entries(mod)) {
    const resolved = resolveZodSchema(exportVal, exportName);
    if (resolved) {
      localSchemas.set(exportName, exportVal);
      globalSchemaRegistry.set(exportName, exportVal);
    }
  }

  // 2. Link exported controller functions to the Zod schema they validate with
  for (const [exportName, exportVal] of Object.entries(mod)) {
    if (typeof exportVal !== "function" || localSchemas.has(exportName)) continue;

    const targetFn = (exportVal as any).__originalFn || exportVal;

    if ((exportVal as any).__zodSchema || targetFn.__zodSchema) {
      const entry = {
        schemaName: `${exportName}Schema`,
        schema: (exportVal as any).__zodSchema || targetFn.__zodSchema,
      };
      controllerSchemaMap.set(exportVal, entry);
      if (targetFn !== exportVal) controllerSchemaMap.set(targetFn, entry);
      continue;
    }

    const fnSource = Function.prototype.toString.call(targetFn);
    // 1. Match patterns like:
    //   createTargetSchema.parseAsync(...)
    //   createVisitSchema(req.user?.role).parseAsync(...)
    //   (0, exports.createLeadSchema)(role).parseAsync(...)
    let matchedKey: string | undefined;
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
      const matchedSchema =
        localSchemas.get(matchedKey) || globalSchemaRegistry.get(matchedKey);
      if (matchedSchema) {
        const entry = {
          schemaName: matchedKey,
          schema: matchedSchema,
        };
        controllerSchemaMap.set(exportVal, entry);
        if (targetFn !== exportVal) controllerSchemaMap.set(targetFn, entry);
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
    leadsController,
  ];

  for (const mod of staticModules) {
    registerModuleExports(mod);
  }

  // Also dynamically scan controllers & validators directories for any newly added files
  const dirsToScan = [
    path.join(__dirname, "../validators"),
    path.join(__dirname, "../controllers/auth"),
    path.join(__dirname, "../controllers/admin"),
  ];

  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith(".ts") && !file.endsWith(".js")) continue;
        if (file.endsWith(".d.ts")) continue;
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const dynamicMod = require(path.join(dir, file));
          registerModuleExports(dynamicMod);
        } catch {
          // Ignore individual dynamic require errors
        }
      }
    } catch {
      // Ignore directory read errors
    }
  }
}

// ==========================================
// 🛣️ 3. Automatic Express Route Introspector
// ==========================================

interface MountedRouterConfig {
  prefix: string;
  tag: string;
  description: string;
  router: any;
  requiresAuth: boolean;
}

const MOUNTED_ROUTERS: MountedRouterConfig[] = [
  {
    prefix: "/api/admin/auth",
    tag: "Auth",
    description: "Authentication endpoints",
    router: authRouter,
    requiresAuth: false,
  },
  {
    prefix: "/api/admin/admins",
    tag: "Admins",
    description: "Admin management endpoints",
    router: adminRouter,
    requiresAuth: true,
  },
  {
    prefix: "/api/admin/leader",
    tag: "Leaders",
    description: "Leader management endpoints",
    router: leaderRouter,
    requiresAuth: true,
  },
  {
    prefix: "/api/admin/sales",
    tag: "Sales",
    description: "Sales staff management endpoints",
    router: salesRouter,
    requiresAuth: true,
  },
  {
    prefix: "/api/admin/visit_status",
    tag: "Visit Status",
    description: "Visit status management endpoints",
    router: statusRouter,
    requiresAuth: true,
  },
  {
    prefix: "/api/admin/target",
    tag: "Targets",
    description: "Target management endpoints",
    router: targetRouter,
    requiresAuth: true,
  },
  {
    prefix: "/api/admin/visits",
    tag: "Visits",
    description: "Visits & Sales conversion endpoints",
    router: visitsRouter,
    requiresAuth: true,
  },
  {
    prefix: "/api/admin/wish_list",
    tag: "Wish List",
    description: "Wish list management endpoints",
    router: wishListRouter,
    requiresAuth: true,
  },
  {
    prefix: "/api/admin/dashboard",
    tag: "Dashboard",
    description: "Dashboard statistics & analytics endpoints",
    router: dashboardRouter,
    requiresAuth: true,
  },
  {
    prefix: "/api/admin/status_requests",
    tag: "Status Requests",
    description: "Visit status change requests endpoints",
    router: requestsRouter,
    requiresAuth: true,
  },
  {
    prefix: "/api/admin/products",
    tag: "Products",
    description: "Products & points configuration endpoints",
    router: productsRouter,
    requiresAuth: true,
  },
  {
    prefix: "/api/admin/leads",
    tag: "Leads",
    description: "Leads management & conversion to visits endpoints",
    router: leadsRouter,
    requiresAuth: true,
  },
];

function toOpenApiPath(expressPath: string): string {
  return expressPath
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")
    .replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
}

function humanizeSummary(method: string, fullPath: string, handlerName?: string): string {
  if (handlerName && handlerName !== "anonymous" && handlerName !== "wrapped") {
    const spaced = handlerName
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }
  return `${method.toUpperCase()} ${fullPath}`;
}

function formatSchemaComponentName(rawName: string, suffix: string): string {
  const cleaned = rawName
    .replace(/^get/i, "")
    .replace(/Schema$/i, "");
  const pascal = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return `${pascal}${suffix}`;
}

function getExportedSchemaName(schemaObj: any, fallbackHandlerName?: string): string {
  for (const [name, val] of globalSchemaRegistry.entries()) {
    if (val === schemaObj) return name;
  }
  if (fallbackHandlerName && fallbackHandlerName !== "handler" && fallbackHandlerName !== "wrapped") {
    return `${fallbackHandlerName}Schema`;
  }
  return "RequestSchema";
}

function findZodSchemaForRoute(routeStack: any[]): { schemaName: string; zodObject: any; handlerName?: string } | null {
  let handlerName: string | undefined;
  let foundEntry: { schemaName: string; schema: any } | null = null;

  for (const layer of routeStack) {
    const rawHandle = layer?.handle;
    if (!rawHandle) continue;

    const originalFn = rawHandle.__originalFn || rawHandle;
    if (
      originalFn?.name &&
      originalFn.name !== "handler" &&
      originalFn.name !== "wrapped" &&
      originalFn.name !== "anonymous"
    ) {
      handlerName = originalFn.name;
    }

    // 1. Check direct __zodSchema attached by validate(schema) middleware
    if (rawHandle.__zodSchema) {
      foundEntry = {
        schemaName: getExportedSchemaName(rawHandle.__zodSchema, handlerName),
        schema: rawHandle.__zodSchema,
      };
    } else if (originalFn.__zodSchema) {
      foundEntry = {
        schemaName: getExportedSchemaName(originalFn.__zodSchema, handlerName),
        schema: originalFn.__zodSchema,
      };
    } else if (controllerSchemaMap.has(originalFn)) {
      // 2. Check controllerSchemaMap (auto-linked from controller's .parseAsync call)
      foundEntry = controllerSchemaMap.get(originalFn)!;
    } else if (typeof originalFn === "function") {
      // 3. Fallback: scan function source directly against globalSchemaRegistry
      const src = Function.prototype.toString.call(originalFn);
      for (const [candidateName, candidateSchema] of globalSchemaRegistry.entries()) {
        if (new RegExp(`\\b${candidateName}\\b`).test(src)) {
          foundEntry = {
            schemaName: candidateName,
            schema: candidateSchema,
          };
          break;
        }
      }
    }
  }

  if (!foundEntry) {
    return handlerName ? { schemaName: "", zodObject: null, handlerName } : null;
  }

  const resolved = resolveZodSchema(foundEntry.schema, foundEntry.schemaName);
  return {
    schemaName:
      foundEntry.schemaName === "RequestSchema" && handlerName
        ? `${handlerName}Schema`
        : foundEntry.schemaName,
    zodObject: resolved,
    handlerName,
  };
}

function buildZodOpenApiSpec(baseSpec: any) {
  initializeRegistries();

  const paths: Record<string, any> = baseSpec.paths ? { ...baseSpec.paths } : {};
  const schemas: Record<string, any> = baseSpec.components?.schemas
    ? { ...baseSpec.components.schemas }
    : {};
  const tags: Array<{ name: string; description: string }> = [];
  const seenTags = new Set<string>();

  for (const mount of MOUNTED_ROUTERS) {
    if (!seenTags.has(mount.tag)) {
      seenTags.add(mount.tag);
      tags.push({ name: mount.tag, description: mount.description });
    }

    const routerStack: any[] = mount.router?.stack || [];
    for (const layer of routerStack) {
      const route = layer?.route;
      if (!route) continue;

      const subPath = route.path === "/" ? "" : route.path;
      const openApiPath = toOpenApiPath(`${mount.prefix}${subPath}`);
      if (!paths[openApiPath]) {
        paths[openApiPath] = {};
      }

      const routeStack: any[] = route.stack || [];
      // Group handlers by HTTP method
      const methodsMap = new Map<string, any[]>();
      for (const item of routeStack) {
        const m = (item.method || "").toLowerCase();
        if (!m) continue;
        if (!methodsMap.has(m)) methodsMap.set(m, []);
        methodsMap.get(m)!.push(item);
      }

      for (const [method, methodLayers] of methodsMap.entries()) {
        const existingOp = paths[openApiPath][method] || {};
        const matched = findZodSchemaForRoute(methodLayers);
        const zodObj = matched?.zodObject;

        // Extract top-level shape of Zod schema (usually { body, params, query })
        const rawTopShape =
          zodObj && zodObj._def
            ? typeof zodObj._def.shape === "function"
              ? zodObj._def.shape()
              : zodObj.shape || {}
            : null;

        let bodyZod = rawTopShape?.body;
        const paramsZod = rawTopShape?.params;
        const queryZod = rawTopShape?.query;

        // If a ZodObject doesn't use { body, params, query } wrapper, treat it directly as body on POST/PUT/PATCH
        if (
          rawTopShape &&
          !bodyZod &&
          !paramsZod &&
          !queryZod &&
          ["post", "put", "patch"].includes(method)
        ) {
          bodyZod = zodObj;
        }

        // 1. Build Path & Query Parameters from Zod + URL path placeholders
        const parameters: any[] = [];
        const paramNamesSeen = new Set<string>();

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
                description: (pSchema as any).description || `${pKey} parameter`,
              });
            } else {
              paramNamesSeen.add(`query:${pKey}`);
              parameters.push({
                in: "query",
                name: pKey,
                required: false,
                schema: pSchema,
                description: (pSchema as any).description || `Filter by ${pKey}`,
              });
            }
          }
        }

        // Ensure any {param} in openApiPath is present in path parameters
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
              description: `${pName} parameter`,
            });
          }
        }

        if (queryZod) {
          const convertedQuery = zodFieldToOpenApi(queryZod);
          const props = convertedQuery.schema.properties || {};
          const reqList: string[] = convertedQuery.schema.required || [];
          for (const [qKey, qSchema] of Object.entries(props)) {
            paramNamesSeen.add(`query:${qKey}`);
            parameters.push({
              in: "query",
              name: qKey,
              required: reqList.includes(qKey),
              schema: qSchema,
              description: (qSchema as any).description || `Filter by ${qKey}`,
            });
          }
        }

        // 2. Build requestBody from Zod body schema
        let requestBody: any = undefined;
        if (bodyZod && ["post", "put", "patch"].includes(method)) {
          const convertedBody = zodFieldToOpenApi(bodyZod);
          const componentName = matched?.schemaName
            ? formatSchemaComponentName(matched.schemaName, "Body")
            : undefined;

          if (componentName) {
            schemas[componentName] = convertedBody.schema;
          }

          requestBody = {
            required: !convertedBody.isOptional,
            content: {
              "application/json": {
                schema: convertedBody.schema,
              },
            },
          };
        }

        // 3. Assemble OpenAPI Operation (Zod schema keys always take priority)
        const operation: Record<string, any> = {
          ...existingOp,
          tags: [mount.tag],
          summary:
            existingOp.summary ||
            humanizeSummary(method, openApiPath, matched?.handlerName),
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
              description: "Successful operation",
            },
            "400": {
              description: "Validation or Bad Request error",
            },
            ...(mount.requiresAuth
              ? {
                  "401": { description: "Unauthorized" },
                  "403": { description: "Forbidden" },
                }
              : {}),
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
      ...(baseSpec.components || {}),
      securitySchemes: {
        ...(baseSpec.components?.securitySchemes || {}),
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas,
    },
  };
}

// ==========================================
// 🚀 4. Setup Swagger UI & JSON Spec Endpoints
// ==========================================

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CRM API Documentation (Auto-Synced with Zod)",
      version: "1.0.0",
      description:
        "API documentation automatically generated and synchronized from Zod validation schemas and Express routes.",
    },
    servers: [
      {
        url: "/",
        description: "Current Server (Auto)",
      },
      {
        url: "https://salesbacknd.systego.net",
        description: "Server (salesbacknd.systego.net)",
      },
      {
        url: "https://salesbcknd.food2go.online",
        description: "Production Server (food2go)",
      },
      {
        url: "http://localhost:3001",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [
    "./src/routes/**/*.ts",
    "./src/controllers/**/*.ts",
    "./dist/routes/**/*.js",
    "./dist/controllers/**/*.js",
  ],
};

export const getSwaggerSpec = () => {
  let baseSpec: any = {
    openapi: "3.0.0",
    info: options.definition?.info,
    servers: options.definition?.servers,
    components: options.definition?.components,
    paths: {},
  };
  try {
    baseSpec = swaggerJSDoc(options);
  } catch (err) {
    console.warn("swaggerJSDoc fallback:", err);
  }
  return buildZodOpenApiSpec(baseSpec);
};

export const setupSwagger = (app: Express) => {
  const swaggerSpec = getSwaggerSpec();

  // JSON endpoint for inspecting the generated OpenAPI spec
  app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(getSwaggerSpec());
  });

  // Swagger UI endpoint
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
      },
    })
  );

  console.log("📝 Swagger documentation (Auto-Zod) is available at /api-docs");
};