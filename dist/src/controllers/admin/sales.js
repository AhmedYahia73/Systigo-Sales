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
  createSales: () => createSales,
  deleteSales: () => deleteSales,
  getAllSales: () => getAllSales,
  getAllSalesSchema: () => getAllSalesSchema,
  getCreateSalesSchema: () => getCreateSalesSchema,
  getSalesById: () => getSalesById,
  lists: () => lists,
  salesIdSchema: () => salesIdSchema,
  updateSales: () => updateSales,
  updateSalesSchema: () => updateSalesSchema
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_response = require("../../utils/response");
var import_NotFound = require("../../Errors/NotFound");
var import_BadRequest = require("../../Errors/BadRequest");
var import_bcrypt = __toESM(require("bcrypt"));
var import_handleImages = require("../../utils/handleImages");
var import_deleteImage = require("../../utils/deleteImage");
var import_zod = require("zod");
var import_drizzle_orm = require("drizzle-orm");
const getCreateSalesSchema = (userRole) => {
  return import_zod.z.object({
    body: import_zod.z.object({
      name: import_zod.z.string({ required_error: "Name is required" }).min(1, "Name cannot be empty").max(200, "Name cannot exceed 200 characters"),
      email: import_zod.z.string({ required_error: "Email is required" }).email("Invalid email format").max(100, "Email cannot exceed 100 characters"),
      phone: import_zod.z.string({ required_error: "Phone is required" }).min(5, "Phone is too short").max(20, "Phone cannot exceed 20 characters"),
      password: import_zod.z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
      image: import_zod.z.string().nullable().optional(),
      // إذا كان الـ role هو leader، نجعل الحقل اختياري لأننا سنأخذه تلقائياً من الـ Token
      leader_id: userRole === "leader" ? import_zod.z.string().uuid("Invalid leader ID format").optional() : import_zod.z.string({ required_error: "Leader ID is required" }).uuid("Invalid leader ID format"),
      target_id: import_zod.z.string().uuid("Invalid target ID format").nullable().optional(),
      status: import_zod.z.enum(["active", "inactive"], {
        required_error: "Status is required",
        invalid_type_error: "Status must be either 'active' or 'inactive'"
      })
    })
  });
};
const updateSalesSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required" }).uuid("Invalid sales ID format")
  }),
  body: import_zod.z.object({
    name: import_zod.z.string().min(1, "Name cannot be empty").max(200).optional(),
    email: import_zod.z.string().email("Invalid email format").max(100).optional(),
    phone: import_zod.z.string().min(5).max(20).optional(),
    password: import_zod.z.string().min(6, "Password must be at least 6 characters").optional(),
    image: import_zod.z.string().nullable().optional(),
    leader_id: import_zod.z.string().uuid("Invalid leader ID format").optional(),
    target_id: import_zod.z.string().uuid("Invalid target ID format").nullable().optional(),
    status: import_zod.z.enum(["active", "inactive"]).optional()
  })
});
const salesIdSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required" }).uuid("Invalid sales ID format")
  })
});
const getAllSalesSchema = import_zod.z.object({
  query: import_zod.z.object({
    page: import_zod.z.coerce.number().int().positive().optional(),
    limit: import_zod.z.coerce.number().int().positive().optional(),
    search: import_zod.z.string().optional(),
    leader_id: import_zod.z.string().uuid().optional(),
    months: import_zod.z.string().optional(),
    year: import_zod.z.coerce.number().int().optional()
  })
});
const getAllSales = async (req, res) => {
  await getAllSalesSchema.parseAsync({ query: req.query });
  const userRole = req.user?.role;
  const userId = req.user?.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const search = req.query.search || "";
  const leaderIdParam = req.query.leader_id ? req.query.leader_id : null;
  const offset = (page - 1) * limit;
  const leaderAlias = (0, import_drizzle_orm.aliasedTable)(import_schema.users, "leaderAlias");
  const whereConditions = [];
  if (userRole === "leader") {
    whereConditions.push(
      (0, import_drizzle_orm.and)(
        (0, import_drizzle_orm.eq)(import_schema.users.role, "sales"),
        (0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId)
      )
    );
  } else {
    whereConditions.push((0, import_drizzle_orm.eq)(import_schema.users.role, "sales"));
    if (leaderIdParam) {
      whereConditions.push((0, import_drizzle_orm.eq)(import_schema.users.leader_id, leaderIdParam));
    }
  }
  if (search.trim()) {
    const searchPattern = `%${search.trim()}%`;
    whereConditions.push(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.like)(import_schema.users.name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.phone, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.email, searchPattern)
      )
    );
  }
  const monthsParam = req.query.months;
  const yearParam = req.query.year;
  if (monthsParam && yearParam) {
    const months = monthsParam.split(",").map(Number).filter((m) => !isNaN(m));
    const year = Number(yearParam);
    if (months.length > 0 && !isNaN(year)) {
      whereConditions.push((0, import_drizzle_orm.inArray)(import_drizzle_orm.sql`MONTH(${import_schema.users.createdAt})`, months));
      whereConditions.push((0, import_drizzle_orm.eq)(import_drizzle_orm.sql`YEAR(${import_schema.users.createdAt})`, year));
    }
  }
  let query = import_db.db.select({
    id: import_schema.users.id,
    name: import_schema.users.name,
    email: import_schema.users.email,
    phone: import_schema.users.phone,
    image: import_schema.users.image,
    target_name: import_schema.targets.name,
    leader_name: leaderAlias.name,
    leader_phone: leaderAlias.phone,
    status: import_schema.users.status,
    createdAt: import_schema.users.createdAt
  }).from(import_schema.users).leftJoin(import_schema.targets, (0, import_drizzle_orm.eq)(import_schema.users.target_id, import_schema.targets.id)).leftJoin(leaderAlias, (0, import_drizzle_orm.eq)(import_schema.users.leader_id, leaderAlias.id)).orderBy((0, import_drizzle_orm.desc)(import_schema.users.createdAt)).$dynamic();
  let countQuery = import_db.db.select({ total: (0, import_drizzle_orm.count)() }).from(import_schema.users).$dynamic();
  if (whereConditions.length > 0) {
    const finalWhere = (0, import_drizzle_orm.and)(...whereConditions);
    query = query.where(finalWhere);
    countQuery = countQuery.where(finalWhere);
  }
  const [allSales, [{ total: totalCount }]] = await Promise.all([
    query.limit(limit).offset(offset),
    countQuery
  ]);
  return (0, import_response.SuccessResponse)(res, {
    sales: allSales,
    pagination: {
      total: Number(totalCount),
      page,
      limit,
      totalPages: Math.ceil(Number(totalCount) / limit)
    }
  }, 200);
};
const lists = async (req, res) => {
  const target_list = await import_db.db.select({
    id: import_schema.targets.id,
    name: import_schema.targets.name
  }).from(import_schema.targets);
  const leaders = await import_db.db.select({
    id: import_schema.users.id,
    name: import_schema.users.name
  }).from(import_schema.users).where((0, import_drizzle_orm.eq)(import_schema.users.role, "leader"));
  (0, import_response.SuccessResponse)(res, { target_list, leaders }, 200);
};
const getSalesById = async (req, res) => {
  const validated = await salesIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const sales = await import_db.db.select({
    id: import_schema.users.id,
    name: import_schema.users.name,
    email: import_schema.users.email,
    phone: import_schema.users.phone,
    image: import_schema.users.image,
    target_id: import_schema.users.target_id,
    leader_id: import_schema.users.leader_id,
    status: import_schema.users.status
  }).from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.id, id), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales"))).limit(1);
  if (!sales[0]) {
    throw new import_NotFound.NotFound("Sales not found");
  }
  (0, import_response.SuccessResponse)(res, { sales: sales[0] }, 200);
};
const createSales = async (req, res) => {
  const validated = await getCreateSalesSchema(req.user?.role).parseAsync({ body: req.body });
  const { name, email, password, phone, image, target_id, status } = validated.body;
  let leader_id;
  if (req.user?.role === "leader") {
    leader_id = req.user.id;
  } else {
    leader_id = validated.body.leader_id;
  }
  if (!leader_id) {
    throw new import_BadRequest.BadRequest("Leader ID is required for this operation");
  }
  const targetLeader = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.id, leader_id), (0, import_drizzle_orm.eq)(import_schema.users.role, "leader"))).limit(1);
  if (!targetLeader[0]) {
    throw new import_BadRequest.BadRequest("The assigned leader was not found or is invalid");
  }
  const existingSales = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(import_schema.users.email, email), (0, import_drizzle_orm.eq)(import_schema.users.phone, phone))).limit(1);
  if (existingSales[0]) {
    throw new import_BadRequest.BadRequest("Email or Phone already exists");
  }
  const hashedPassword = await import_bcrypt.default.hash(password, 10);
  let savedSalesImage = null;
  if (image) {
    const result = await (0, import_handleImages.saveBase64Image)(req, image, "sales");
    savedSalesImage = result.url;
  }
  await import_db.db.insert(import_schema.users).values({
    name,
    email,
    phone,
    leader_id,
    image: savedSalesImage,
    password: hashedPassword,
    role: "sales",
    target_id: target_id || null,
    status
  });
  (0, import_response.SuccessResponse)(res, { message: "Sales created successfully" }, 201);
};
const updateSales = async (req, res) => {
  const validated = await updateSalesSchema.parseAsync({
    params: req.params,
    body: req.body
  });
  const { id } = validated.params;
  const { name, email, password, phone, image, target_id, status } = validated.body;
  const existingSales = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.id, id), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales"))).limit(1);
  if (!existingSales[0]) {
    throw new import_NotFound.NotFound("Sales not found");
  }
  let leader_id;
  if (req.user?.role === "leader") {
    leader_id = req.user.id;
  } else {
    leader_id = validated.body.leader_id;
  }
  if (leader_id) {
    const targetLeader = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.id, leader_id), (0, import_drizzle_orm.eq)(import_schema.users.role, "leader"))).limit(1);
    if (!targetLeader[0]) {
      throw new import_BadRequest.BadRequest("The assigned leader was not found or is invalid");
    }
  }
  if (email && email !== existingSales[0].email) {
    const duplicateEmail = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.email, email), (0, import_drizzle_orm.ne)(import_schema.users.id, id))).limit(1);
    if (duplicateEmail[0]) {
      throw new import_BadRequest.BadRequest("Email already exists");
    }
  }
  if (phone && phone !== existingSales[0].phone) {
    const duplicatePhone = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.phone, phone), (0, import_drizzle_orm.ne)(import_schema.users.id, id))).limit(1);
    if (duplicatePhone[0]) {
      throw new import_BadRequest.BadRequest("Phone already exists");
    }
  }
  let salesImage = existingSales[0].image;
  if (image !== void 0) {
    if (image) {
      const result = await (0, import_handleImages.saveBase64Image)(req, image, "sales");
      if (existingSales[0].image) {
        await (0, import_deleteImage.deletePhotoFromServer)(existingSales[0].image);
      }
      salesImage = result.url;
    } else {
      if (existingSales[0].image) {
        await (0, import_deleteImage.deletePhotoFromServer)(existingSales[0].image);
      }
      salesImage = null;
    }
  }
  const updateData = {};
  if (name !== void 0) updateData.name = name;
  if (email !== void 0) updateData.email = email;
  if (phone !== void 0) updateData.phone = phone;
  if (salesImage !== void 0) updateData.image = salesImage;
  if (leader_id !== void 0) updateData.leader_id = leader_id;
  if (status !== void 0) updateData.status = status;
  if (target_id !== void 0) updateData.target_id = target_id;
  if (password) {
    updateData.password = await import_bcrypt.default.hash(password, 10);
  }
  await import_db.db.update(import_schema.users).set(updateData).where((0, import_drizzle_orm.eq)(import_schema.users.id, id));
  (0, import_response.SuccessResponse)(res, { message: "Sales updated successfully" }, 200);
};
const deleteSales = async (req, res) => {
  const validated = await salesIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const existingSales = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.id, id), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales"))).limit(1);
  if (!existingSales[0]) {
    throw new import_NotFound.NotFound("Sales not found");
  }
  if (existingSales[0].image) {
    await (0, import_deleteImage.deletePhotoFromServer)(existingSales[0].image);
  }
  await import_db.db.delete(import_schema.users).where((0, import_drizzle_orm.eq)(import_schema.users.id, id));
  (0, import_response.SuccessResponse)(res, { message: "Sales deleted successfully" }, 200);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSales,
  deleteSales,
  getAllSales,
  getAllSalesSchema,
  getCreateSalesSchema,
  getSalesById,
  lists,
  salesIdSchema,
  updateSales,
  updateSalesSchema
});
