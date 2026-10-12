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
  dashboardQuerySchema: () => dashboardQuerySchema,
  viewDashboard: () => viewDashboard
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_BadRequest = require("../../Errors/BadRequest");
var import_drizzle_orm = require("drizzle-orm");
var import_response = require("../../utils/response");
var import_zod = require("zod");
const dashboardQuerySchema = import_zod.z.object({
  query: import_zod.z.object({
    from: import_zod.z.string().optional(),
    to: import_zod.z.string().optional()
  })
});
const viewDashboard = async (req, res) => {
  const role = req.user?.role;
  const userId = req.user?.id;
  if (!userId) {
    throw new import_BadRequest.BadRequest("User not authenticated.");
  }
  const validated = await dashboardQuerySchema.parseAsync({ query: req.query });
  const { from, to } = validated.query;
  const visitDateConditions = [];
  if (from) {
    visitDateConditions.push((0, import_drizzle_orm.gte)(import_schema.visits.createdAt, new Date(from)));
  }
  if (to) {
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
    visitDateConditions.push((0, import_drizzle_orm.lte)(import_schema.visits.createdAt, endDate));
  }
  const targetDateConditions = [];
  if (from) {
    const fromDate = new Date(from);
    const fromYear = fromDate.getFullYear();
    const fromMonth = fromDate.getMonth() + 1;
    targetDateConditions.push(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.gt)(import_schema.target_items.year, fromYear),
        (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.target_items.year, fromYear), (0, import_drizzle_orm.gte)(import_schema.target_items.month, fromMonth))
      )
    );
  }
  if (to) {
    const toDate = new Date(to);
    const toYear = toDate.getFullYear();
    const toMonth = toDate.getMonth() + 1;
    targetDateConditions.push(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.lt)(import_schema.target_items.year, toYear),
        (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.target_items.year, toYear), (0, import_drizzle_orm.lte)(import_schema.target_items.month, toMonth))
      )
    );
  }
  const salesList = await import_db.db.select({ id: import_schema.users.id }).from(import_schema.users).where((0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId));
  const sales_ids = salesList.map((item) => item.id);
  const joinConditions = [(0, import_drizzle_orm.eq)(import_schema.visits.status_id, import_schema.visitStatus.id)];
  if (role === "sales") {
    joinConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, userId));
  } else if (role === "leader") {
    if (sales_ids.length > 0) {
      joinConditions.push((0, import_drizzle_orm.inArray)(import_schema.visits.sales_id, sales_ids));
    } else {
      joinConditions.push(import_drizzle_orm.sql`1 = 0`);
    }
  }
  if (visitDateConditions.length > 0) {
    joinConditions.push(...visitDateConditions);
  }
  const allVisitStatuss = await import_db.db.select({
    id: import_schema.visitStatus.id,
    name: import_schema.visitStatus.name,
    count: (0, import_drizzle_orm.count)(import_schema.visits.id)
  }).from(import_schema.visitStatus).leftJoin(import_schema.visits, (0, import_drizzle_orm.and)(...joinConditions)).where((0, import_drizzle_orm.eq)(import_schema.visitStatus.status, true)).groupBy(import_schema.visitStatus.id, import_schema.visitStatus.name);
  const visitsWhereConditions = [];
  if (role === "sales") {
    visitsWhereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, userId));
  } else if (role === "leader") {
    if (sales_ids.length > 0) {
      visitsWhereConditions.push((0, import_drizzle_orm.inArray)(import_schema.visits.sales_id, sales_ids));
    } else {
      visitsWhereConditions.push(import_drizzle_orm.sql`1 = 0`);
    }
  }
  if (visitDateConditions.length > 0) {
    visitsWhereConditions.push(...visitDateConditions);
  }
  const [countsResult] = await import_db.db.select({
    negotiation: import_drizzle_orm.sql`CAST(COALESCE(COUNT(CASE WHEN ${import_schema.visits.status} = 'visit' THEN 1 END), 0) AS UNSIGNED)`,
    sales: import_drizzle_orm.sql`CAST(COALESCE(COUNT(CASE WHEN ${import_schema.visits.status} = 'sales' THEN 1 END), 0) AS UNSIGNED)`,
    delivered: import_drizzle_orm.sql`CAST(COALESCE(COUNT(CASE WHEN ${import_schema.visits.status} = 'delivered' THEN 1 END), 0) AS UNSIGNED)`,
    targetAchievedPoints: import_drizzle_orm.sql`CAST(COALESCE(SUM(CASE WHEN ${import_schema.visits.status} != 'visit' THEN ${import_schema.visits.points} ELSE 0 END), 0) AS UNSIGNED)`
  }).from(import_schema.visits).where(visitsWhereConditions.length > 0 ? (0, import_drizzle_orm.and)(...visitsWhereConditions) : void 0);
  const negotiation = Number(countsResult?.negotiation || 0);
  const sales = Number(countsResult?.sales || 0);
  const delivered = Number(countsResult?.delivered || 0);
  const targetAchievedSales = sales + delivered;
  const targetAchievedVisits = negotiation;
  const targetAchievedPoints = Number(countsResult?.targetAchievedPoints || 0);
  const targetWhereConditions = [];
  if (role === "sales") {
    targetWhereConditions.push((0, import_drizzle_orm.eq)(import_schema.target_sales.user_id, userId));
  } else if (role === "leader") {
    if (sales_ids.length > 0) {
      targetWhereConditions.push((0, import_drizzle_orm.inArray)(import_schema.target_sales.user_id, sales_ids));
    } else {
      targetWhereConditions.push(import_drizzle_orm.sql`1 = 0`);
    }
  } else {
  }
  if (targetDateConditions.length > 0) {
    targetWhereConditions.push(...targetDateConditions.filter(Boolean));
  }
  const [salesTargetResult] = await import_db.db.select({
    total_visits_target: import_drizzle_orm.sql`CAST(COALESCE(SUM(CASE WHEN ${import_schema.targets.type} = 'visit' THEN ${import_schema.target_items.number} END), 0) AS UNSIGNED) AS total_visits_target`,
    total_sales_target: import_drizzle_orm.sql`CAST(COALESCE(SUM(CASE WHEN ${import_schema.targets.type} = 'sales' THEN ${import_schema.target_items.number} END), 0) AS UNSIGNED) AS total_sales_target`,
    total_points_target: import_drizzle_orm.sql`CAST(COALESCE(SUM(CASE WHEN ${import_schema.targets.type} = 'points' THEN ${import_schema.target_items.number} END), 0) AS UNSIGNED) AS total_points_target`
  }).from(import_schema.target_sales).leftJoin(import_schema.targets, (0, import_drizzle_orm.eq)(import_schema.target_sales.target_id, import_schema.targets.id)).leftJoin(import_schema.target_items, (0, import_drizzle_orm.eq)(import_schema.target_items.target_id, import_schema.targets.id)).where((0, import_drizzle_orm.and)(...targetWhereConditions));
  const total_visits_target = Number(salesTargetResult?.total_visits_target || 0);
  const total_sales_target = Number(salesTargetResult?.total_sales_target || 0);
  const total_points_target = Number(salesTargetResult?.total_points_target || 0);
  (0, import_response.SuccessResponse)(res, {
    allVisitStatuss,
    negotiation,
    sales,
    delivered,
    targetAchievedSales,
    targetAchievedVisits,
    targetAchievedPoints,
    total_visits_target,
    total_sales_target,
    total_points_target
  }, 200);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  dashboardQuerySchema,
  viewDashboard
});
