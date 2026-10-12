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
  createTargetSchema: () => createTargetSchema,
  createTargets: () => createTargets,
  deleteTargets: () => deleteTargets,
  getAllTargets: () => getAllTargets,
  getAllTargetsSchema: () => getAllTargetsSchema,
  getTargetsById: () => getTargetsById,
  lists: () => lists,
  targetIdSchema: () => targetIdSchema,
  updateTargetSchema: () => updateTargetSchema,
  updateTargets: () => updateTargets
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_drizzle_orm = require("drizzle-orm");
var import_response = require("../../utils/response");
var import_NotFound = require("../../Errors/NotFound");
var import_zod = require("zod");
var import_crypto = __toESM(require("crypto"));
const createTargetSchema = import_zod.z.object({
  body: import_zod.z.object({
    type: import_zod.z.enum(["visit", "sales", "points"], {
      required_error: "Type is required",
      invalid_type_error: "Type must be either 'visit', 'sales', or 'points'"
    }).default("visit"),
    name: import_zod.z.string({
      required_error: "Name is required"
    }).min(1, "Name cannot be empty").max(255, "Name cannot exceed 255 characters"),
    items: import_zod.z.array(
      import_zod.z.object({
        year: import_zod.z.number({ required_error: "Year is required" }).int(),
        month: import_zod.z.number({ required_error: "Month is required" }).int().min(1).max(12),
        number: import_zod.z.number({ required_error: "Monthly target number is required" }).positive()
      }),
      { required_error: "Items are required" }
    ).min(1, "At least one target item is required"),
    sales: import_zod.z.array(
      import_zod.z.string({ invalid_type_error: "Sales User ID must be a string" }).uuid("Invalid User ID format"),
      { required_error: "Sales users array is required" }
    ).min(1, "At least one sales user must be assigned")
  })
});
const updateTargetSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required in parameters" })
  }),
  body: import_zod.z.object({
    type: import_zod.z.enum(["visit", "sales", "points"]).optional(),
    name: import_zod.z.string().min(1, "Name cannot be empty").max(255).optional(),
    items: import_zod.z.array(
      import_zod.z.object({
        year: import_zod.z.number({ required_error: "Year is required" }).int(),
        month: import_zod.z.number({ required_error: "Month is required" }).int().min(1).max(12),
        number: import_zod.z.number({ required_error: "Monthly target number is required" }).positive()
      })
    ).min(1, "At least one target item is required").optional(),
    sales: import_zod.z.array(
      import_zod.z.string({ invalid_type_error: "Sales User ID must be a string" }).uuid("Invalid User ID format")
    ).min(1, "At least one sales user must be assigned").optional()
  })
});
const targetIdSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required in parameters" })
  })
});
const getAllTargetsSchema = import_zod.z.object({
  params: import_zod.z.object({
    type: import_zod.z.enum(["visit", "sales", "points"]).optional()
  })
});
const getAllTargets = async (req, res) => {
  const validated = await getAllTargetsSchema.parseAsync({ params: req.params });
  const { type } = validated.params;
  let query = import_db.db.select({
    id: import_schema.targets.id,
    type: import_schema.targets.type,
    name: import_schema.targets.name,
    createdAt: import_schema.targets.createdAt
  }).from(import_schema.targets);
  if (type) {
    query = query.where((0, import_drizzle_orm.eq)(import_schema.targets.type, type));
  }
  const alltargets = await query;
  (0, import_response.SuccessResponse)(res, { targets: alltargets }, 200);
};
const lists = async (req, res) => {
  const sales = await import_db.db.select({
    id: import_schema.users.id,
    phone: import_schema.users.phone,
    name: import_schema.users.name
  }).from(import_schema.users).where((0, import_drizzle_orm.eq)(import_schema.users.role, "sales"));
  (0, import_response.SuccessResponse)(
    res,
    {
      sales
    },
    200
  );
};
const getTargetsById = async (req, res) => {
  const validated = await targetIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const targetResult = await import_db.db.select({
    id: import_schema.targets.id,
    type: import_schema.targets.type,
    name: import_schema.targets.name,
    createdAt: import_schema.targets.createdAt,
    updatedAt: import_schema.targets.updatedAt
  }).from(import_schema.targets).where((0, import_drizzle_orm.eq)(import_schema.targets.id, id)).limit(1);
  const target = targetResult[0];
  if (!target) {
    throw new import_NotFound.NotFound("Target not found");
  }
  const [items, salesList] = await Promise.all([
    import_db.db.select({
      id: import_schema.target_items.id,
      year: import_schema.target_items.year,
      month: import_schema.target_items.month,
      number: import_schema.target_items.number
    }).from(import_schema.target_items).where((0, import_drizzle_orm.eq)(import_schema.target_items.target_id, id)),
    import_db.db.select({
      id: import_schema.target_sales.id,
      user: {
        id: import_schema.users.id,
        name: import_schema.users.name,
        email: import_schema.users.email,
        role: import_schema.users.role
      }
    }).from(import_schema.target_sales).innerJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.target_sales.user_id, import_schema.users.id)).where((0, import_drizzle_orm.eq)(import_schema.target_sales.target_id, id))
  ]);
  (0, import_response.SuccessResponse)(
    res,
    {
      target: {
        ...target,
        items,
        sales: salesList
      }
    },
    200
  );
};
const createTargets = async (req, res) => {
  const validated = await createTargetSchema.parseAsync({ body: req.body });
  const { type, name, items, sales } = validated.body;
  const targetId = import_crypto.default.randomUUID();
  await import_db.db.transaction(async (tx) => {
    await tx.insert(import_schema.targets).values({
      id: targetId,
      type,
      name
    });
    const itemsToInsert = items.map((item) => ({
      target_id: targetId,
      year: item.year,
      month: item.month,
      number: item.number
    }));
    await tx.insert(import_schema.target_items).values(itemsToInsert);
    const salesToInsert = sales.map((userId) => ({
      target_id: targetId,
      user_id: userId
    }));
    await tx.insert(import_schema.target_sales).values(salesToInsert);
  });
  (0, import_response.SuccessResponse)(res, { id: targetId, message: "Target along with items and sales assigned successfully" }, 201);
};
const updateTargets = async (req, res) => {
  const validated = await updateTargetSchema.parseAsync({
    params: req.params,
    body: req.body
  });
  const { id } = validated.params;
  const { items, sales, ...targetFields } = validated.body;
  const existingTargets = await import_db.db.select({ id: import_schema.targets.id }).from(import_schema.targets).where((0, import_drizzle_orm.eq)(import_schema.targets.id, id)).limit(1);
  if (!existingTargets[0]) {
    throw new import_NotFound.NotFound("Target not found");
  }
  const updateData = Object.fromEntries(
    Object.entries(targetFields).filter(([_, value]) => value !== void 0)
  );
  await import_db.db.transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.update(import_schema.targets).set(updateData).where((0, import_drizzle_orm.eq)(import_schema.targets.id, id));
    }
    if (items !== void 0) {
      await tx.delete(import_schema.target_items).where((0, import_drizzle_orm.eq)(import_schema.target_items.target_id, id));
      if (items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          target_id: id,
          year: item.year,
          month: item.month,
          number: item.number
        }));
        await tx.insert(import_schema.target_items).values(itemsToInsert);
      }
    }
    if (sales !== void 0) {
      await tx.delete(import_schema.target_sales).where((0, import_drizzle_orm.eq)(import_schema.target_sales.target_id, id));
      if (sales.length > 0) {
        const salesToInsert = sales.map((userId) => ({
          target_id: id,
          user_id: userId
        }));
        await tx.insert(import_schema.target_sales).values(salesToInsert);
      }
    }
  });
  (0, import_response.SuccessResponse)(res, { message: "Target updated successfully" }, 200);
};
const deleteTargets = async (req, res) => {
  const validated = await targetIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const existingTargets = await import_db.db.select({ id: import_schema.targets.id }).from(import_schema.targets).where((0, import_drizzle_orm.eq)(import_schema.targets.id, id)).limit(1);
  if (!existingTargets[0]) {
    throw new import_NotFound.NotFound("Target not found");
  }
  await import_db.db.delete(import_schema.targets).where((0, import_drizzle_orm.eq)(import_schema.targets.id, id));
  (0, import_response.SuccessResponse)(res, { message: "Target deleted successfully" }, 200);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createTargetSchema,
  createTargets,
  deleteTargets,
  getAllTargets,
  getAllTargetsSchema,
  getTargetsById,
  lists,
  targetIdSchema,
  updateTargetSchema,
  updateTargets
});
