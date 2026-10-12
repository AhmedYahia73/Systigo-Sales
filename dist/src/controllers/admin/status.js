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
  VisitStatusIdSchema: () => VisitStatusIdSchema,
  createVisitStatusSchema: () => createVisitStatusSchema,
  createVisitStatuss: () => createVisitStatuss,
  deleteVisitStatuss: () => deleteVisitStatuss,
  getAllVisitStatuss: () => getAllVisitStatuss,
  getVisitStatussById: () => getVisitStatussById,
  updateVisitStatusSchema: () => updateVisitStatusSchema,
  updateVisitStatuss: () => updateVisitStatuss
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_drizzle_orm = require("drizzle-orm");
var import_response = require("../../utils/response");
var import_NotFound = require("../../Errors/NotFound");
var import_zod = require("zod");
const createVisitStatusSchema = import_zod.z.object({
  body: import_zod.z.object({
    name: import_zod.z.string({
      required_error: "Name is required"
    }).min(1, "Name cannot be empty"),
    status: import_zod.z.boolean({
      required_error: "Status is required",
      invalid_type_error: "Status must be a boolean (true or false)"
    })
  })
});
const updateVisitStatusSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required in parameters" })
    // غيرها لـ z.coerce.number() لو الـ ID رقم في الداتابيز
  }),
  body: import_zod.z.object({
    name: import_zod.z.string().min(1, "Name cannot be empty").optional(),
    status: import_zod.z.boolean({ invalid_type_error: "Status must be a boolean" }).optional()
  })
});
const VisitStatusIdSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required in parameters" })
    // غيرها لـ z.coerce.number() لو الـ ID رقم
  })
});
const getAllVisitStatuss = async (req, res) => {
  const query = import_db.db.select({
    id: import_schema.visitStatus.id,
    name: import_schema.visitStatus.name,
    status: import_schema.visitStatus.status
  }).from(import_schema.visitStatus);
  const allVisitStatuss = await query;
  (0, import_response.SuccessResponse)(res, { allVisitStatuss }, 200);
};
const getVisitStatussById = async (req, res) => {
  const validated = await VisitStatusIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const VisitStatuss = await import_db.db.select({
    id: import_schema.visitStatus.id,
    name: import_schema.visitStatus.name,
    status: import_schema.visitStatus.status
  }).from(import_schema.visitStatus).where((0, import_drizzle_orm.eq)(import_schema.visitStatus.id, id)).limit(1);
  if (!VisitStatuss[0]) {
    throw new import_NotFound.NotFound("VisitStatuss not found");
  }
  (0, import_response.SuccessResponse)(res, { VisitStatuss: VisitStatuss[0] }, 200);
};
const createVisitStatuss = async (req, res) => {
  const validated = await createVisitStatusSchema.parseAsync({ body: req.body });
  const { status, name } = validated.body;
  await import_db.db.insert(import_schema.visitStatus).values({
    status,
    name
  });
  (0, import_response.SuccessResponse)(res, { message: "VisitStatuss created successfully" }, 201);
};
const updateVisitStatuss = async (req, res) => {
  const validated = await updateVisitStatusSchema.parseAsync({
    params: req.params,
    body: req.body
  });
  const { id } = validated.params;
  const { status, name } = validated.body;
  const existingVisitStatuss = await import_db.db.select().from(import_schema.visitStatus).where((0, import_drizzle_orm.eq)(import_schema.visitStatus.id, id)).limit(1);
  if (!existingVisitStatuss[0]) {
    throw new import_NotFound.NotFound("VisitStatuss not found");
  }
  const updateData = {};
  if (status !== void 0) updateData.status = status;
  if (name !== void 0) updateData.name = name;
  await import_db.db.update(import_schema.visitStatus).set(updateData).where((0, import_drizzle_orm.eq)(import_schema.visitStatus.id, id));
  (0, import_response.SuccessResponse)(res, { message: "VisitStatuss updated successfully" }, 200);
};
const deleteVisitStatuss = async (req, res) => {
  const validated = await VisitStatusIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const existingVisitStatuss = await import_db.db.select().from(import_schema.visitStatus).where((0, import_drizzle_orm.eq)(import_schema.visitStatus.id, id)).limit(1);
  if (!existingVisitStatuss[0]) {
    throw new import_NotFound.NotFound("VisitStatuss not found");
  }
  await import_db.db.delete(import_schema.visitStatus).where((0, import_drizzle_orm.eq)(import_schema.visitStatus.id, id));
  (0, import_response.SuccessResponse)(res, { message: "VisitStatuss deleted successfully" }, 200);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VisitStatusIdSchema,
  createVisitStatusSchema,
  createVisitStatuss,
  deleteVisitStatuss,
  getAllVisitStatuss,
  getVisitStatussById,
  updateVisitStatusSchema,
  updateVisitStatuss
});
