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
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
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
  createLeader: () => createLeader,
  createLeaderSchema: () => createLeaderSchema,
  deleteLeader: () => deleteLeader,
  getAllLeader: () => getAllLeader,
  getAllLeaderSchema: () => getAllLeaderSchema,
  getLeaderById: () => getLeaderById,
  leaderIdSchema: () => leaderIdSchema,
  lists: () => lists,
  updateLeader: () => updateLeader,
  updateLeaderSchema: () => updateLeaderSchema
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_drizzle_orm = require("drizzle-orm");
var import_response = require("../../utils/response");
var import_NotFound = require("../../Errors/NotFound");
var import_BadRequest = require("../../Errors/BadRequest");
var import_bcrypt = __toESM(require("bcrypt"));
var import_handleImages = require("../../utils/handleImages");
var import_deleteImage = require("../../utils/deleteImage");
var import_zod = require("zod");
const createLeaderSchema = import_zod.z.object({
  body: import_zod.z.object({
    name: import_zod.z.string({ required_error: "Name is required" }).min(1, "Name cannot be empty").max(200, "Name cannot exceed 200 characters"),
    email: import_zod.z.string({ required_error: "Email is required" }).email("Invalid email format").max(100, "Email cannot exceed 100 characters"),
    phone: import_zod.z.string({ required_error: "Phone is required" }).min(5, "Phone is too short").max(20, "Phone cannot exceed 20 characters"),
    password: import_zod.z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
    image: import_zod.z.string().nullable().optional(),
    target_id: import_zod.z.string().uuid("Invalid target ID format").nullable().optional(),
    status: import_zod.z.enum(["active", "inactive"], {
      required_error: "Status is required",
      invalid_type_error: "Status must be either 'active' or 'inactive'"
    })
  })
});
const updateLeaderSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required" }).uuid("Invalid leader ID format")
  }),
  body: import_zod.z.object({
    name: import_zod.z.string().min(1, "Name cannot be empty").max(200).optional(),
    email: import_zod.z.string().email("Invalid email format").max(100).optional(),
    phone: import_zod.z.string().min(5).max(20).optional(),
    password: import_zod.z.string().min(6, "Password must be at least 6 characters").optional(),
    image: import_zod.z.string().nullable().optional(),
    target_id: import_zod.z.string().uuid("Invalid target ID format").nullable().optional(),
    status: import_zod.z.enum(["active", "inactive"]).optional()
  })
});
const leaderIdSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required" }).uuid("Invalid leader ID format")
  })
});
const getAllLeaderSchema = import_zod.z.object({
  query: import_zod.z.object({
    page: import_zod.z.coerce.number().int().positive().optional(),
    limit: import_zod.z.coerce.number().int().positive().optional(),
    search: import_zod.z.string().optional()
  })
});
const getAllLeader = async (req, res) => {
  await getAllLeaderSchema.parseAsync({ query: req.query });
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const offset = (page - 1) * limit;
  let whereConditions = [];
  whereConditions.push((0, import_drizzle_orm.eq)(import_schema.users.role, "leader"));
  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.like)(import_schema.users.name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.phone, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.email, searchPattern)
      )
    );
  }
  let query = import_db.db.select({
    id: import_schema.users.id,
    name: import_schema.users.name,
    email: import_schema.users.email,
    phone: import_schema.users.phone,
    image: import_schema.users.image,
    target: import_schema.targets.name,
    status: import_schema.users.status,
    createdAt: import_schema.users.createdAt
  }).from(import_schema.users).leftJoin(import_schema.targets, (0, import_drizzle_orm.eq)(import_schema.users.target_id, import_schema.targets.id)).orderBy((0, import_drizzle_orm.desc)(import_schema.users.createdAt)).$dynamic();
  let countQuery = import_db.db.select({ total: (0, import_drizzle_orm.count)() }).from(import_schema.users).$dynamic();
  if (whereConditions.length > 0) {
    query = query.where((0, import_drizzle_orm.and)(...whereConditions));
    countQuery = countQuery.where((0, import_drizzle_orm.and)(...whereConditions));
  }
  const [allLeaders, [{ total: totalCount }]] = await Promise.all([
    query.limit(limit).offset(offset),
    countQuery
  ]);
  (0, import_response.SuccessResponse)(res, {
    leaders: allLeaders,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  }, 200);
};
const lists = async (req, res) => {
  const target_list = await import_db.db.select({
    id: import_schema.targets.id,
    name: import_schema.targets.name
  }).from(import_schema.targets);
  (0, import_response.SuccessResponse)(res, { target_list }, 200);
};
const getLeaderById = async (req, res) => {
  const validated = await leaderIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const leader = await import_db.db.select({
    id: import_schema.users.id,
    name: import_schema.users.name,
    email: import_schema.users.email,
    phone: import_schema.users.phone,
    image: import_schema.users.image,
    target_id: import_schema.users.target_id,
    status: import_schema.users.status
  }).from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.id, id), (0, import_drizzle_orm.eq)(import_schema.users.role, "leader"))).limit(1);
  if (!leader[0]) {
    throw new import_NotFound.NotFound("Leader not found");
  }
  (0, import_response.SuccessResponse)(res, { leader: leader[0] }, 200);
};
const createLeader = async (req, res) => {
  const validated = await createLeaderSchema.parseAsync({ body: req.body });
  const { name, email, password, phone, image, target_id, status } = validated.body;
  const existingLeader = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(import_schema.users.email, email), (0, import_drizzle_orm.eq)(import_schema.users.phone, phone))).limit(1);
  if (existingLeader[0]) {
    throw new import_BadRequest.BadRequest("Email or Phone already exists");
  }
  const hashedPassword = await import_bcrypt.default.hash(password, 10);
  let savedLeaderImage = null;
  if (image) {
    const result = await (0, import_handleImages.saveBase64Image)(req, image, "leaders");
    savedLeaderImage = result.url;
  }
  await import_db.db.insert(import_schema.users).values({
    name,
    email,
    phone,
    image: savedLeaderImage,
    password: hashedPassword,
    role: "leader",
    target_id: target_id || null,
    // ربط القائد بالـ target إن وجد
    status
  });
  (0, import_response.SuccessResponse)(res, { message: "Leader created successfully" }, 201);
};
const updateLeader = async (req, res) => {
  const validated = await updateLeaderSchema.parseAsync({
    params: req.params,
    body: req.body
  });
  const { id } = validated.params;
  const { name, email, password, phone, image, target_id, status } = validated.body;
  const existingLeader = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.id, id), (0, import_drizzle_orm.eq)(import_schema.users.role, "leader"))).limit(1);
  if (!existingLeader[0]) {
    throw new import_NotFound.NotFound("Leader not found");
  }
  if (email && email !== existingLeader[0].email) {
    const duplicateEmail = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.email, email), (0, import_drizzle_orm.ne)(import_schema.users.id, id))).limit(1);
    if (duplicateEmail[0]) {
      throw new import_BadRequest.BadRequest("Email already exists");
    }
  }
  if (phone && phone !== existingLeader[0].phone) {
    const duplicatePhone = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.phone, phone), (0, import_drizzle_orm.ne)(import_schema.users.id, id))).limit(1);
    if (duplicatePhone[0]) {
      throw new import_BadRequest.BadRequest("Phone already exists");
    }
  }
  let leaderImage = existingLeader[0].image;
  if (image !== void 0) {
    if (image) {
      const result = await (0, import_handleImages.saveBase64Image)(req, image, "leaders");
      if (existingLeader[0].image) {
        await (0, import_deleteImage.deletePhotoFromServer)(existingLeader[0].image);
      }
      leaderImage = result.url;
    } else {
      if (existingLeader[0].image) {
        await (0, import_deleteImage.deletePhotoFromServer)(existingLeader[0].image);
      }
      leaderImage = null;
    }
  }
  const updateData = {};
  if (name !== void 0) updateData.name = name;
  if (email !== void 0) updateData.email = email;
  if (phone !== void 0) updateData.phone = phone;
  if (leaderImage !== void 0) updateData.image = leaderImage;
  if (status !== void 0) updateData.status = status;
  if (target_id !== void 0) updateData.target_id = target_id;
  if (password) {
    updateData.password = await import_bcrypt.default.hash(password, 10);
  }
  await import_db.db.update(import_schema.users).set(updateData).where((0, import_drizzle_orm.eq)(import_schema.users.id, id));
  (0, import_response.SuccessResponse)(res, { message: "Leader updated successfully" }, 200);
};
const deleteLeader = async (req, res) => {
  const validated = await leaderIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const existingLeader = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.id, id), (0, import_drizzle_orm.eq)(import_schema.users.role, "leader"))).limit(1);
  if (!existingLeader[0]) {
    throw new import_NotFound.NotFound("Leader not found");
  }
  if (existingLeader[0].image) {
    await (0, import_deleteImage.deletePhotoFromServer)(existingLeader[0].image);
  }
  await import_db.db.delete(import_schema.users).where((0, import_drizzle_orm.eq)(import_schema.users.id, id));
  (0, import_response.SuccessResponse)(res, { message: "Leader deleted successfully" }, 200);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createLeader,
  createLeaderSchema,
  deleteLeader,
  getAllLeader,
  getAllLeaderSchema,
  getLeaderById,
  leaderIdSchema,
  lists,
  updateLeader,
  updateLeaderSchema
});
