"use strict";
// src/config/swagger.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = exports.getSwaggerSpec = void 0;
exports.zodFieldToOpenApi = zodFieldToOpenApi;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Controllers & Validators (imported for automatic Zod schema & handler introspection)
const authValidators = __importStar(require("../validators/auth"));
const authController = __importStar(require("../controllers/auth/auth"));
const adminController = __importStar(require("../controllers/admin/admin"));
const leaderController = __importStar(require("../controllers/admin/leader"));
const salesController = __importStar(require("../controllers/admin/sales"));
const statusController = __importStar(require("../controllers/admin/status"));
const targetController = __importStar(require("../controllers/admin/target"));
const visitsController = __importStar(require("../controllers/admin/visits"));
const wishlistController = __importStar(require("../controllers/admin/wishlist"));
const dashboardController = __importStar(require("../controllers/admin/dashboard"));
const statusRequestsController = __importStar(require("../controllers/admin/statusRequests"));
const productsController = __importStar(require("../controllers/admin/products"));
const leadsController = __importStar(require("../controllers/admin/leads"));
// Routers (imported for automatic Express route stack introspection)
const auth_1 = __importDefault(require("../routes/admins/auth"));
const admin_1 = __importDefault(require("../routes/admins/admin"));
const leader_1 = __importDefault(require("../routes/admins/leader"));
const sales_1 = __importDefault(require("../routes/admins/sales"));
const status_1 = __importDefault(require("../routes/admins/status"));
const target_1 = __importDefault(require("../routes/admins/target"));
const visits_1 = __importDefault(require("../routes/admins/visits"));
const wishList_1 = __importDefault(require("../routes/admins/wishList"));
const dashboard_1 = __importDefault(require("../routes/admins/dashboard"));
const requests_1 = __importDefault(require("../routes/admins/requests"));
const products_1 = __importDefault(require("../routes/admins/products"));
const leads_1 = __importDefault(require("../routes/admins/leads"));
function isZodSchema(val) {
    return Boolean(val && typeof val === "object" && val._def && typeof val.parseAsync === "function");
}
function resolveZodSchema(schemaOrFactory, nameHint = "") {
    if (!schemaOrFactory)
        return null;
    if (isZodSchema(schemaOrFactory))
        return schemaOrFactory;
    if (typeof schemaOrFactory === "function") {
        if (schemaOrFactory.__originalFn)
            return null;
        if (schemaOrFactory.constructor?.name === "AsyncFunction")
            return null;
        const fnName = nameHint || schemaOrFactory.name || "";
        if (!/schema$/i.test(fnName))
            return null;
        if (schemaOrFactory.length > 1)
            return null;
        try {
            const result = schemaOrFactory();
            if (result && typeof result.then === "function") {
                result.catch?.(() => { });
                return null;
            }
            if (isZodSchema(result))
                return result;
        }
        catch {
            return null;
        }
    }
    return null;
}
function getSmartExample(fieldName, openApiSchema) {
    if (openApiSchema.example !== undefined)
        return openApiSchema.example;
    if (openApiSchema.default !== undefined)
        return openApiSchema.default;
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
    if (key.includes("phone"))
        return "01012345678";
    if (key === "password")
        return "secret123";
    if (key === "lat")
        return 30.0444;
    if (key === "lng")
        return 31.2357;
    if (key === "year")
        return new Date().getFullYear();
    if (key === "month")
        return new Date().getMonth() + 1;
    if (key === "number" || key === "point" || key === "points")
        return 100;
    if (key === "feez")
        return 500;
    if (key === "duration")
        return "1 Year";
    if (key === "address")
        return "Cairo, Egypt";
    if (key === "name" || key.endsWith("_name"))
        return "Example Name";
    if (key === "description" || key === "notes")
        return "Sample notes";
    if (key === "demo_link")
        return "https://example.com/demo";
    return undefined;
}
function zodFieldToOpenApi(zodType, fieldName = "") {
    if (!zodType || !zodType._def) {
        return { schema: { type: "string" }, isOptional: true };
    }
    let current = zodType;
    let isOptional = false;
    let isNullable = false;
    let defaultValue = undefined;
    let description = current.description || current._def?.description;
    // Unwrap wrapper types (Optional, Nullable, Default, Effects, Branded, Readonly, Catch, Pipeline)
    let safetyCounter = 0;
    while (current && current._def && safetyCounter < 20) {
        safetyCounter++;
        const typeName = current._def.typeName;
        if (!description && (current.description || current._def.description)) {
            description = current.description || current._def.description;
        }
        if (typeName === "ZodOptional") {
            isOptional = true;
            current = current._def.innerType;
        }
        else if (typeName === "ZodNullable") {
            isNullable = true;
            current = current._def.innerType;
        }
        else if (typeName === "ZodDefault") {
            isOptional = true;
            try {
                defaultValue = current._def.defaultValue();
            }
            catch {
                // ignore
            }
            current = current._def.innerType;
        }
        else if (typeName === "ZodEffects") {
            current = current._def.schema;
        }
        else if (typeName === "ZodBranded" || typeName === "ZodReadonly" || typeName === "ZodCatch") {
            current = current._def.innerType || current._def.type;
        }
        else if (typeName === "ZodPipeline") {
            current = current._def.in;
        }
        else {
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
                if (check.kind === "email")
                    schema.format = "email";
                else if (check.kind === "uuid")
                    schema.format = "uuid";
                else if (check.kind === "url")
                    schema.format = "uri";
                else if (check.kind === "datetime")
                    schema.format = "date-time";
                else if (check.kind === "min")
                    schema.minLength = check.value;
                else if (check.kind === "max")
                    schema.maxLength = check.value;
            }
            break;
        }
        case "ZodNumber": {
            const checks = current._def.checks || [];
            const isInt = checks.some((c) => c.kind === "int");
            schema = { type: isInt ? "integer" : "number" };
            for (const check of checks) {
                if (check.kind === "min")
                    schema.minimum = check.value;
                else if (check.kind === "max")
                    schema.maximum = check.value;
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
            if (values.length > 0)
                schema.example = values[0];
            break;
        }
        case "ZodNativeEnum": {
            const values = Object.values(current._def.values || {});
            schema = {
                type: "string",
                enum: values,
            };
            if (values.length > 0)
                schema.example = values[0];
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
            const rawShape = typeof current._def.shape === "function"
                ? current._def.shape()
                : current.shape || {};
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
                properties,
            };
            if (required.length > 0) {
                schema.required = required;
            }
            break;
        }
        case "ZodUnion":
        case "ZodDiscriminatedUnion": {
            const options = current._def.options || [];
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
const globalSchemaRegistry = new Map();
const controllerSchemaMap = new WeakMap();
function registerModuleExports(mod) {
    if (!mod || typeof mod !== "object")
        return;
    const localSchemas = new Map();
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
        if (typeof exportVal !== "function" || localSchemas.has(exportName))
            continue;
        const targetFn = exportVal.__originalFn || exportVal;
        if (exportVal.__zodSchema || targetFn.__zodSchema) {
            const entry = {
                schemaName: `${exportName}Schema`,
                schema: exportVal.__zodSchema || targetFn.__zodSchema,
            };
            controllerSchemaMap.set(exportVal, entry);
            if (targetFn !== exportVal)
                controllerSchemaMap.set(targetFn, entry);
            continue;
        }
        const fnSource = Function.prototype.toString.call(targetFn);
        // 1. Match patterns like:
        //   createTargetSchema.parseAsync(...)
        //   createVisitSchema(req.user?.role).parseAsync(...)
        //   (0, exports.createLeadSchema)(role).parseAsync(...)
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
                const entry = {
                    schemaName: matchedKey,
                    schema: matchedSchema,
                };
                controllerSchemaMap.set(exportVal, entry);
                if (targetFn !== exportVal)
                    controllerSchemaMap.set(targetFn, entry);
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
        path_1.default.join(__dirname, "../validators"),
        path_1.default.join(__dirname, "../controllers/auth"),
        path_1.default.join(__dirname, "../controllers/admin"),
    ];
    for (const dir of dirsToScan) {
        if (!fs_1.default.existsSync(dir))
            continue;
        try {
            const files = fs_1.default.readdirSync(dir);
            for (const file of files) {
                if (!file.endsWith(".ts") && !file.endsWith(".js"))
                    continue;
                if (file.endsWith(".d.ts"))
                    continue;
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const dynamicMod = require(path_1.default.join(dir, file));
                    registerModuleExports(dynamicMod);
                }
                catch {
                    // Ignore individual dynamic require errors
                }
            }
        }
        catch {
            // Ignore directory read errors
        }
    }
}
const MOUNTED_ROUTERS = [
    {
        prefix: "/api/admin/auth",
        tag: "Auth",
        description: "Authentication endpoints",
        router: auth_1.default,
        requiresAuth: false,
    },
    {
        prefix: "/api/admin/admins",
        tag: "Admins",
        description: "Admin management endpoints",
        router: admin_1.default,
        requiresAuth: true,
    },
    {
        prefix: "/api/admin/leader",
        tag: "Leaders",
        description: "Leader management endpoints",
        router: leader_1.default,
        requiresAuth: true,
    },
    {
        prefix: "/api/admin/sales",
        tag: "Sales",
        description: "Sales staff management endpoints",
        router: sales_1.default,
        requiresAuth: true,
    },
    {
        prefix: "/api/admin/visit_status",
        tag: "Visit Status",
        description: "Visit status management endpoints",
        router: status_1.default,
        requiresAuth: true,
    },
    {
        prefix: "/api/admin/target",
        tag: "Targets",
        description: "Target management endpoints",
        router: target_1.default,
        requiresAuth: true,
    },
    {
        prefix: "/api/admin/visits",
        tag: "Visits",
        description: "Visits & Sales conversion endpoints",
        router: visits_1.default,
        requiresAuth: true,
    },
    {
        prefix: "/api/admin/wish_list",
        tag: "Wish List",
        description: "Wish list management endpoints",
        router: wishList_1.default,
        requiresAuth: true,
    },
    {
        prefix: "/api/admin/dashboard",
        tag: "Dashboard",
        description: "Dashboard statistics & analytics endpoints",
        router: dashboard_1.default,
        requiresAuth: true,
    },
    {
        prefix: "/api/admin/status_requests",
        tag: "Status Requests",
        description: "Visit status change requests endpoints",
        router: requests_1.default,
        requiresAuth: true,
    },
    {
        prefix: "/api/admin/products",
        tag: "Products",
        description: "Products & points configuration endpoints",
        router: products_1.default,
        requiresAuth: true,
    },
    {
        prefix: "/api/admin/leads",
        tag: "Leads",
        description: "Leads management & conversion to visits endpoints",
        router: leads_1.default,
        requiresAuth: true,
    },
];
function toOpenApiPath(expressPath) {
    return expressPath
        .replace(/\/+/g, "/")
        .replace(/\/$/, "")
        .replace(/:([a-zA-Z0-9_]+)/g, "{$1}");
}
function humanizeSummary(method, fullPath, handlerName) {
    if (handlerName && handlerName !== "anonymous" && handlerName !== "wrapped") {
        const spaced = handlerName
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .trim();
        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    }
    return `${method.toUpperCase()} ${fullPath}`;
}
function formatSchemaComponentName(rawName, suffix) {
    const cleaned = rawName
        .replace(/^get/i, "")
        .replace(/Schema$/i, "");
    const pascal = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return `${pascal}${suffix}`;
}
function getExportedSchemaName(schemaObj, fallbackHandlerName) {
    for (const [name, val] of globalSchemaRegistry.entries()) {
        if (val === schemaObj)
            return name;
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
        if (!rawHandle)
            continue;
        const originalFn = rawHandle.__originalFn || rawHandle;
        if (originalFn?.name &&
            originalFn.name !== "handler" &&
            originalFn.name !== "wrapped" &&
            originalFn.name !== "anonymous") {
            handlerName = originalFn.name;
        }
        // 1. Check direct __zodSchema attached by validate(schema) middleware
        if (rawHandle.__zodSchema) {
            foundEntry = {
                schemaName: getExportedSchemaName(rawHandle.__zodSchema, handlerName),
                schema: rawHandle.__zodSchema,
            };
        }
        else if (originalFn.__zodSchema) {
            foundEntry = {
                schemaName: getExportedSchemaName(originalFn.__zodSchema, handlerName),
                schema: originalFn.__zodSchema,
            };
        }
        else if (controllerSchemaMap.has(originalFn)) {
            // 2. Check controllerSchemaMap (auto-linked from controller's .parseAsync call)
            foundEntry = controllerSchemaMap.get(originalFn);
        }
        else if (typeof originalFn === "function") {
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
        schemaName: foundEntry.schemaName === "RequestSchema" && handlerName
            ? `${handlerName}Schema`
            : foundEntry.schemaName,
        zodObject: resolved,
        handlerName,
    };
}
function buildZodOpenApiSpec(baseSpec) {
    initializeRegistries();
    const paths = baseSpec.paths ? { ...baseSpec.paths } : {};
    const schemas = baseSpec.components?.schemas
        ? { ...baseSpec.components.schemas }
        : {};
    const tags = [];
    const seenTags = new Set();
    for (const mount of MOUNTED_ROUTERS) {
        if (!seenTags.has(mount.tag)) {
            seenTags.add(mount.tag);
            tags.push({ name: mount.tag, description: mount.description });
        }
        const routerStack = mount.router?.stack || [];
        for (const layer of routerStack) {
            const route = layer?.route;
            if (!route)
                continue;
            const subPath = route.path === "/" ? "" : route.path;
            const openApiPath = toOpenApiPath(`${mount.prefix}${subPath}`);
            if (!paths[openApiPath]) {
                paths[openApiPath] = {};
            }
            const routeStack = route.stack || [];
            // Group handlers by HTTP method
            const methodsMap = new Map();
            for (const item of routeStack) {
                const m = (item.method || "").toLowerCase();
                if (!m)
                    continue;
                if (!methodsMap.has(m))
                    methodsMap.set(m, []);
                methodsMap.get(m).push(item);
            }
            for (const [method, methodLayers] of methodsMap.entries()) {
                const existingOp = paths[openApiPath][method] || {};
                const matched = findZodSchemaForRoute(methodLayers);
                const zodObj = matched?.zodObject;
                // Extract top-level shape of Zod schema (usually { body, params, query })
                const rawTopShape = zodObj && zodObj._def
                    ? typeof zodObj._def.shape === "function"
                        ? zodObj._def.shape()
                        : zodObj.shape || {}
                    : null;
                let bodyZod = rawTopShape?.body;
                const paramsZod = rawTopShape?.params;
                const queryZod = rawTopShape?.query;
                // If a ZodObject doesn't use { body, params, query } wrapper, treat it directly as body on POST/PUT/PATCH
                if (rawTopShape &&
                    !bodyZod &&
                    !paramsZod &&
                    !queryZod &&
                    ["post", "put", "patch"].includes(method)) {
                    bodyZod = zodObj;
                }
                // 1. Build Path & Query Parameters from Zod + URL path placeholders
                const parameters = [];
                const paramNamesSeen = new Set();
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
                                description: pSchema.description || `${pKey} parameter`,
                            });
                        }
                        else {
                            paramNamesSeen.add(`query:${pKey}`);
                            parameters.push({
                                in: "query",
                                name: pKey,
                                required: false,
                                schema: pSchema,
                                description: pSchema.description || `Filter by ${pKey}`,
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
                    const reqList = convertedQuery.schema.required || [];
                    for (const [qKey, qSchema] of Object.entries(props)) {
                        paramNamesSeen.add(`query:${qKey}`);
                        parameters.push({
                            in: "query",
                            name: qKey,
                            required: reqList.includes(qKey),
                            schema: qSchema,
                            description: qSchema.description || `Filter by ${qKey}`,
                        });
                    }
                }
                // 2. Build requestBody from Zod body schema
                let requestBody = undefined;
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
                const operation = {
                    ...existingOp,
                    tags: [mount.tag],
                    summary: existingOp.summary ||
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
                }
                else if (["get", "delete", "head"].includes(method)) {
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
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "CRM API Documentation (Auto-Synced with Zod)",
            version: "1.0.0",
            description: "API documentation automatically generated and synchronized from Zod validation schemas and Express routes.",
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
const getSwaggerSpec = () => {
    let baseSpec = {
        openapi: "3.0.0",
        info: options.definition?.info,
        servers: options.definition?.servers,
        components: options.definition?.components,
        paths: {},
    };
    try {
        baseSpec = (0, swagger_jsdoc_1.default)(options);
    }
    catch (err) {
        console.warn("swaggerJSDoc fallback:", err);
    }
    return buildZodOpenApiSpec(baseSpec);
};
exports.getSwaggerSpec = getSwaggerSpec;
const setupSwagger = (app) => {
    const swaggerSpec = (0, exports.getSwaggerSpec)();
    // JSON endpoint for inspecting the generated OpenAPI spec
    app.get("/api-docs.json", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send((0, exports.getSwaggerSpec)());
    });
    // Swagger UI endpoint
    app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec, {
        explorer: true,
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: "list",
        },
    }));
    console.log("📝 Swagger documentation (Auto-Zod) is available at /api-docs");
};
exports.setupSwagger = setupSwagger;
