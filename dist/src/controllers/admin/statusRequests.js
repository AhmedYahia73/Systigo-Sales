var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  changeStatus: () => changeStatus,
  getHistoryRequest: () => getHistoryRequest,
  getPendingRequest: () => getPendingRequest,
  getRequestsSchema: () => getRequestsSchema,
  requestIdSchema: () => requestIdSchema
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_response = require("../../utils/response");
var import_NotFound = require("../../Errors/NotFound");
var import_zod = require("zod");
var import_drizzle_orm = require("drizzle-orm");
var import_visits = require("./visits");
const requestIdSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format")
  }),
  body: import_zod.z.object({
    status: import_zod.z.enum(["approve", "reject"], {
      required_error: "Action status is required",
      invalid_type_error: "Status must be either 'approve' or 'reject'"
    })
  })
});
const getRequestsSchema = import_zod.z.object({
  query: import_zod.z.object({
    page: import_zod.z.coerce.number().int().positive().optional(),
    limit: import_zod.z.coerce.number().int().positive().optional(),
    search: import_zod.z.string().optional()
  })
});
const getPendingRequest = async (req, res) => {
  await getRequestsSchema.parseAsync({ query: req.query });
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const search = (req.query.search || "").trim();
  const offset = (page - 1) * limit;
  const baseCondition = (0, import_drizzle_orm.eq)(import_schema.statusRequest.status, "pending");
  const leaderCondition = req.user?.role === "leader" ? (0, import_drizzle_orm.eq)(import_schema.users.leader_id, req.user?.id) : void 0;
  const searchCondition = search ? (0, import_drizzle_orm.or)(
    (0, import_drizzle_orm.like)(import_schema.users.name, `%${search}%`),
    (0, import_drizzle_orm.like)(import_schema.users.phone, `%${search}%`),
    (0, import_drizzle_orm.like)(import_schema.visits.name, `%${search}%`)
  ) : void 0;
  const whereClause = (0, import_drizzle_orm.and)(baseCondition, leaderCondition, searchCondition);
  const pendingRequests = await import_db.db.select({
    id: import_schema.statusRequest.id,
    user_name: import_schema.users.name,
    user_phone: import_schema.users.phone,
    visit_name: import_schema.visits.name,
    from: import_schema.statusRequest.from,
    to: import_schema.statusRequest.to,
    status: import_schema.statusRequest.status,
    createdAt: import_schema.statusRequest.createdAt
  }).from(import_schema.statusRequest).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.statusRequest.userId, import_schema.users.id)).leftJoin(import_schema.visits, (0, import_drizzle_orm.eq)(import_schema.statusRequest.visitId, import_schema.visits.id)).where(whereClause).orderBy((0, import_drizzle_orm.desc)(import_schema.statusRequest.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await import_db.db.select({ total: (0, import_drizzle_orm.count)() }).from(import_schema.statusRequest).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.statusRequest.userId, import_schema.users.id)).leftJoin(import_schema.visits, (0, import_drizzle_orm.eq)(import_schema.statusRequest.visitId, import_schema.visits.id)).where(whereClause);
  const totalPages = Math.ceil(total / limit);
  (0, import_response.SuccessResponse)(res, {
    pendingRequests,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  }, 200);
};
const getHistoryRequest = async (req, res) => {
  await getRequestsSchema.parseAsync({ query: req.query });
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const search = (req.query.search || "").trim();
  const offset = (page - 1) * limit;
  const baseCondition = (0, import_drizzle_orm.ne)(import_schema.statusRequest.status, "pending");
  const leaderCondition = req.user?.role === "leader" ? (0, import_drizzle_orm.eq)(import_schema.users.leader_id, req.user?.id) : void 0;
  const searchCondition = search ? (0, import_drizzle_orm.or)(
    (0, import_drizzle_orm.like)(import_schema.users.name, `%${search}%`),
    (0, import_drizzle_orm.like)(import_schema.users.phone, `%${search}%`),
    (0, import_drizzle_orm.like)(import_schema.visits.name, `%${search}%`)
  ) : void 0;
  const whereClause = (0, import_drizzle_orm.and)(baseCondition, leaderCondition, searchCondition);
  const historyRequests = await import_db.db.select({
    id: import_schema.statusRequest.id,
    user_name: import_schema.users.name,
    user_phone: import_schema.users.phone,
    visit_name: import_schema.visits.name,
    from: import_schema.statusRequest.from,
    to: import_schema.statusRequest.to,
    status: import_schema.statusRequest.status,
    createdAt: import_schema.statusRequest.createdAt
  }).from(import_schema.statusRequest).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.statusRequest.userId, import_schema.users.id)).leftJoin(import_schema.visits, (0, import_drizzle_orm.eq)(import_schema.statusRequest.visitId, import_schema.visits.id)).where(whereClause).orderBy((0, import_drizzle_orm.desc)(import_schema.statusRequest.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await import_db.db.select({ total: (0, import_drizzle_orm.count)() }).from(import_schema.statusRequest).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.statusRequest.userId, import_schema.users.id)).leftJoin(import_schema.visits, (0, import_drizzle_orm.eq)(import_schema.statusRequest.visitId, import_schema.visits.id)).where(whereClause);
  const totalPages = Math.ceil(total / limit);
  (0, import_response.SuccessResponse)(res, {
    historyRequests,
    pagination: {
      totalItems: total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  }, 200);
};
const changeStatus = async (req, res) => {
  const validated = await requestIdSchema.parseAsync({ params: req.params, body: req.body });
  const id = validated.params.id;
  const status = validated.body.status;
  const existRequest = await import_db.db.select({
    id: import_schema.statusRequest.id,
    from: import_schema.statusRequest.from,
    to: import_schema.statusRequest.to,
    visitId: import_schema.statusRequest.visitId
  }).from(import_schema.statusRequest).where((0, import_drizzle_orm.eq)(import_schema.statusRequest.id, id)).limit(1);
  if (!existRequest.length) {
    throw new import_NotFound.NotFound("Request not found");
  }
  await import_db.db.update(import_schema.statusRequest).set({ status }).where((0, import_drizzle_orm.eq)(import_schema.statusRequest.id, id));
  if (status === "approve") {
    const visitUpdateData = { status: existRequest[0].to };
    if (existRequest[0].to === "sales" || existRequest[0].to === "delivered") {
      const visit = await import_db.db.select().from(import_schema.visits).where((0, import_drizzle_orm.eq)(import_schema.visits.id, existRequest[0].visitId)).limit(1);
      if (visit[0] && visit[0].products) {
        const parsedProducts = (0, import_visits.parseProductsArray)(visit[0].products);
        visitUpdateData.points = await (0, import_visits.calculatePointsForProducts)(parsedProducts);
      }
    } else {
      visitUpdateData.points = 0;
    }
    await import_db.db.update(import_schema.visits).set(visitUpdateData).where((0, import_drizzle_orm.eq)(import_schema.visits.id, existRequest[0].visitId));
  }
  (0, import_response.SuccessResponse)(res, { message: "Status updated successfully" }, 200);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  changeStatus,
  getHistoryRequest,
  getPendingRequest,
  getRequestsSchema,
  requestIdSchema
});
