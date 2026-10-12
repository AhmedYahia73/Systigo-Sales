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
  VisitIdSchema: () => VisitIdSchema,
  calculatePointsForProducts: () => calculatePointsForProducts,
  createVisitSchema: () => createVisitSchema,
  createVisits: () => createVisits,
  deleteVisits: () => deleteVisits,
  enrichRecordsWithProducts: () => enrichRecordsWithProducts,
  getAllSales: () => getAllSales,
  getAllVisits: () => getAllVisits,
  getAllVisitsSchema: () => getAllVisitsSchema,
  getVisitsById: () => getVisitsById,
  getVisitsCounts: () => getVisitsCounts,
  lists: () => lists,
  parseProductsArray: () => parseProductsArray,
  updateVisitSchema: () => updateVisitSchema,
  updateVisits: () => updateVisits
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_response = require("../../utils/response");
var import_NotFound = require("../../Errors/NotFound");
var import_BadRequest = require("../../Errors/BadRequest");
var import_zod = require("zod");
var import_drizzle_orm = require("drizzle-orm");
const parseProductsArray = (raw) => {
  if (!raw) return [];
  let parsed = raw;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item) => item && typeof item.product_id === "string" && item.product_id.trim() !== "").map((item) => ({
    product_id: item.product_id,
    duration: item.duration || ""
  }));
};
const calculatePointsForProducts = async (items) => {
  const validItems = parseProductsArray(items);
  if (validItems.length === 0) return 0;
  const productIds = Array.from(new Set(validItems.map((i) => i.product_id)));
  const dbProducts = await import_db.db.select().from(import_schema.products).where((0, import_drizzle_orm.inArray)(import_schema.products.id, productIds));
  const productMap = new Map(dbProducts.map((p) => [p.id, p]));
  let totalPoints = 0;
  for (const item of validItems) {
    const prod = productMap.get(item.product_id);
    if (prod && prod.points) {
      let pointsData = prod.points;
      if (typeof pointsData === "string") {
        try {
          pointsData = JSON.parse(pointsData);
        } catch (e) {
          pointsData = [];
        }
      }
      if (Array.isArray(pointsData)) {
        const pointEntry = pointsData.find((p) => p.duration === item.duration);
        if (pointEntry && pointEntry.point !== void 0) {
          totalPoints += Number(pointEntry.point) || 0;
        }
      }
    }
  }
  return totalPoints;
};
const enrichRecordsWithProducts = async (records) => {
  if (records.length === 0) return [];
  const allProducts = await import_db.db.select({ id: import_schema.products.id, name: import_schema.products.name }).from(import_schema.products);
  const productNameMap = new Map(allProducts.map((p) => [p.id, p.name]));
  return records.map((record) => {
    const parsedProducts = parseProductsArray(record.products).map((item) => ({
      ...item,
      product_name: productNameMap.get(item.product_id) || ""
    }));
    const productSummary = parsedProducts.map((p) => p.product_name ? p.duration ? `${p.product_name} (${p.duration})` : p.product_name : "").filter(Boolean).join(", ");
    return {
      ...record,
      products: parsedProducts,
      product: productSummary || null
    };
  });
};
const visitProductItemSchema = import_zod.z.object({
  product_id: import_zod.z.string({ required_error: "Product ID is required" }).min(1, "Product ID cannot be empty"),
  duration: import_zod.z.string().optional().default("")
});
const createVisitSchema = (userRole) => {
  return import_zod.z.object({
    body: import_zod.z.object({
      lat: import_zod.z.number({ required_error: "Latitude (lat) is required" }).min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
      lng: import_zod.z.number({ required_error: "Longitude (lng) is required" }).min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180"),
      name: import_zod.z.string({ required_error: "Name is required" }).min(1, "Name cannot be empty").max(255, "Name cannot exceed 255 characters"),
      owner_name: import_zod.z.string().max(255, "Owner name cannot exceed 255 characters").nullable().optional(),
      owner_phone: import_zod.z.string().max(20, "Owner phone cannot exceed 20 characters").nullable().optional(),
      address: import_zod.z.string({ required_error: "Address is required" }).min(1, "Address cannot be empty").max(500, "Address cannot exceed 500 characters"),
      notes: import_zod.z.string().max(1e3, "Notes cannot exceed 1000 characters").nullable().optional(),
      phone: import_zod.z.string({ required_error: "Phone is required" }).min(5, "Phone number is too short").max(20, "Phone cannot exceed 20 characters"),
      status: import_zod.z.enum(["visit", "sales", "delivered"], {
        invalid_type_error: "Status must be either 'visit', 'sales', or 'delivered'"
      }).optional(),
      status_id: import_zod.z.string().nullable().optional(),
      sales_id: userRole === "sales" || userRole === "leader" ? import_zod.z.string().uuid().optional() : import_zod.z.string({ required_error: "Sales ID is required" }),
      products: import_zod.z.array(visitProductItemSchema).nullable().optional(),
      // Backward compatibility if single product_id/duration sent
      product_id: import_zod.z.string().nullable().optional(),
      duration: import_zod.z.string().nullable().optional()
    })
  });
};
const updateVisitSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required in parameters" })
  }),
  body: import_zod.z.object({
    lat: import_zod.z.number().min(-90).max(90).optional(),
    lng: import_zod.z.number().min(-180).max(180).optional(),
    name: import_zod.z.string().min(1).max(255).optional(),
    owner_name: import_zod.z.string().max(255).nullable().optional(),
    owner_phone: import_zod.z.string().max(20).nullable().optional(),
    address: import_zod.z.string().min(1).max(500).optional(),
    notes: import_zod.z.string().max(1e3).nullable().optional(),
    phone: import_zod.z.string().min(5).max(20).optional(),
    status: import_zod.z.enum(["visit", "sales", "delivered"]).optional(),
    status_id: import_zod.z.string().nullable().optional(),
    sales_id: import_zod.z.string().nullable().optional(),
    products: import_zod.z.array(visitProductItemSchema).nullable().optional(),
    product_id: import_zod.z.string().nullable().optional(),
    duration: import_zod.z.string().nullable().optional()
  })
});
const VisitIdSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required in parameters" })
  })
});
const getAllVisitsSchema = import_zod.z.object({
  query: import_zod.z.object({
    page: import_zod.z.coerce.number().int().positive().optional(),
    limit: import_zod.z.coerce.number().int().positive().optional(),
    search: import_zod.z.string().optional(),
    sales_id: import_zod.z.string().optional(),
    status_id: import_zod.z.string().optional(),
    from: import_zod.z.string().optional(),
    to: import_zod.z.string().optional(),
    months: import_zod.z.string().optional(),
    year: import_zod.z.coerce.number().int().optional()
  })
});
const getAllVisits = async (req, res) => {
  await getAllVisitsSchema.parseAsync({ query: req.query });
  const userRole = req.user?.role;
  const userId = req.user?.id;
  const querySalesId = req.query.sales_id;
  const queryStatusId = req.query.status_id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const fromDateStr = req.query.from;
  const toDateStr = req.query.to;
  const offset = (page - 1) * limit;
  let whereConditions = [];
  whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.status, "visit"));
  if (queryStatusId) {
    whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.status_id, queryStatusId));
  }
  if (userRole === "admin") {
    if (querySalesId) {
      whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, querySalesId));
    }
  } else if (userRole === "leader") {
    const teamSales = await import_db.db.select({ id: import_schema.users.id }).from(import_schema.users).where(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales")),
        (0, import_drizzle_orm.eq)(import_schema.users.id, userId)
      )
    );
    const salesIds = teamSales.map((s) => s.id);
    if (querySalesId) {
      if (salesIds.includes(querySalesId)) {
        whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, querySalesId));
      } else {
        throw new import_BadRequest.BadRequest("You do not have access to this sales member's visits.");
      }
    } else {
      if (salesIds.length > 0) {
        whereConditions.push((0, import_drizzle_orm.inArray)(import_schema.visits.sales_id, salesIds));
      } else {
        return (0, import_response.SuccessResponse)(res, { allVisits: [], pagination: { total: 0, page, limit, totalPages: 0 } }, 200);
      }
    }
  } else if (userRole === "sales") {
    whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, userId));
  } else {
    throw new import_BadRequest.BadRequest("Unauthorized role");
  }
  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.like)(import_schema.visits.name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.visits.owner_name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.visits.phone, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.visits.owner_phone, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.email, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.phone, searchPattern)
      )
    );
  }
  if (fromDateStr) {
    const fromDate = /* @__PURE__ */ new Date(`${fromDateStr}T00:00:00.000Z`);
    if (!isNaN(fromDate.getTime())) {
      whereConditions.push((0, import_drizzle_orm.gte)(import_schema.visits.createdAt, fromDate));
    }
  }
  if (toDateStr) {
    const toDate = /* @__PURE__ */ new Date(`${toDateStr}T23:59:59.999Z`);
    if (!isNaN(toDate.getTime())) {
      whereConditions.push((0, import_drizzle_orm.lte)(import_schema.visits.createdAt, toDate));
    }
  }
  const monthsParam = req.query.months;
  const yearParam = req.query.year;
  if (monthsParam && yearParam) {
    const months = monthsParam.split(",").map(Number).filter((m) => !isNaN(m));
    const year = Number(yearParam);
    if (months.length > 0 && !isNaN(year)) {
      whereConditions.push((0, import_drizzle_orm.inArray)(import_drizzle_orm.sql`MONTH(${import_schema.visits.createdAt})`, months));
      whereConditions.push((0, import_drizzle_orm.eq)(import_drizzle_orm.sql`YEAR(${import_schema.visits.createdAt})`, year));
    }
  }
  let baseQuery = import_db.db.select({
    id: import_schema.visits.id,
    lat: import_schema.visits.lat,
    lng: import_schema.visits.lng,
    name: import_schema.visits.name,
    owner_name: import_schema.visits.owner_name,
    owner_phone: import_schema.visits.owner_phone,
    address: import_schema.visits.address,
    notes: import_schema.visits.notes,
    phone: import_schema.visits.phone,
    points: import_schema.visits.points,
    status: import_schema.visits.status,
    visit_status: import_schema.visitStatus.name,
    status_id: import_schema.visits.status_id,
    sales_id: import_schema.users.id,
    sales: import_schema.users.name,
    sales_phone: import_schema.users.phone,
    products: import_schema.visits.products,
    createdAt: import_drizzle_orm.sql`DATE_FORMAT(${import_schema.visits.createdAt}, '%Y-%m-%d')`
  }).from(import_schema.visits).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.visits.sales_id, import_schema.users.id)).leftJoin(import_schema.visitStatus, (0, import_drizzle_orm.eq)(import_schema.visits.status_id, import_schema.visitStatus.id)).orderBy((0, import_drizzle_orm.desc)(import_schema.visits.createdAt)).$dynamic();
  let countQuery = import_db.db.select({ total: (0, import_drizzle_orm.count)() }).from(import_schema.visits).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.visits.sales_id, import_schema.users.id)).leftJoin(import_schema.visitStatus, (0, import_drizzle_orm.eq)(import_schema.visits.status_id, import_schema.visitStatus.id)).$dynamic();
  if (whereConditions.length > 0) {
    baseQuery = baseQuery.where((0, import_drizzle_orm.and)(...whereConditions));
    countQuery = countQuery.where((0, import_drizzle_orm.and)(...whereConditions));
  }
  const [allVisitsRaw, [{ total: totalCount }]] = await Promise.all([
    baseQuery.limit(limit).offset(offset),
    countQuery
  ]);
  const enrichedVisits = await enrichRecordsWithProducts(allVisitsRaw);
  const allVisits = enrichedVisits.map((visit) => ({
    ...visit,
    map_link: `https://www.google.com/maps/search/?api=1&query=${visit.lat},${visit.lng}`
  }));
  (0, import_response.SuccessResponse)(res, {
    allVisits,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  }, 200);
};
const getAllSales = async (req, res) => {
  await getAllVisitsSchema.parseAsync({ query: req.query });
  const userRole = req.user?.role;
  const userId = req.user?.id;
  const querySalesId = req.query.sales_id;
  const queryStatusId = req.query.status_id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const fromDateStr = req.query.from;
  const toDateStr = req.query.to;
  const offset = (page - 1) * limit;
  let whereConditions = [];
  whereConditions.push((0, import_drizzle_orm.ne)(import_schema.visits.status, "visit"));
  if (queryStatusId) {
    whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.status_id, queryStatusId));
  }
  if (userRole === "admin") {
    if (querySalesId) {
      whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, querySalesId));
    }
  } else if (userRole === "leader") {
    const teamSales = await import_db.db.select({ id: import_schema.users.id }).from(import_schema.users).where(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales")),
        (0, import_drizzle_orm.eq)(import_schema.users.id, userId)
      )
    );
    const salesIds = teamSales.map((s) => s.id);
    if (querySalesId) {
      if (salesIds.includes(querySalesId)) {
        whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, querySalesId));
      } else {
        throw new import_BadRequest.BadRequest("You do not have access to this sales member's visits.");
      }
    } else {
      if (salesIds.length > 0) {
        whereConditions.push((0, import_drizzle_orm.inArray)(import_schema.visits.sales_id, salesIds));
      } else {
        return (0, import_response.SuccessResponse)(res, { allVisits: [], pagination: { total: 0, page, limit, totalPages: 0 } }, 200);
      }
    }
  } else if (userRole === "sales") {
    whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, userId));
  } else {
    throw new import_BadRequest.BadRequest("Unauthorized role");
  }
  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.like)(import_schema.visits.name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.visits.owner_name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.visits.phone, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.visits.owner_phone, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.email, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.phone, searchPattern)
      )
    );
  }
  if (fromDateStr) {
    const fromDate = /* @__PURE__ */ new Date(`${fromDateStr}T00:00:00.000Z`);
    if (!isNaN(fromDate.getTime())) {
      whereConditions.push((0, import_drizzle_orm.gte)(import_schema.visits.createdAt, fromDate));
    }
  }
  if (toDateStr) {
    const toDate = /* @__PURE__ */ new Date(`${toDateStr}T23:59:59.999Z`);
    if (!isNaN(toDate.getTime())) {
      whereConditions.push((0, import_drizzle_orm.lte)(import_schema.visits.createdAt, toDate));
    }
  }
  const monthsParam = req.query.months;
  const yearParam = req.query.year;
  if (monthsParam && yearParam) {
    const months = monthsParam.split(",").map(Number).filter((m) => !isNaN(m));
    const year = Number(yearParam);
    if (months.length > 0 && !isNaN(year)) {
      whereConditions.push((0, import_drizzle_orm.inArray)(import_drizzle_orm.sql`MONTH(${import_schema.visits.createdAt})`, months));
      whereConditions.push((0, import_drizzle_orm.eq)(import_drizzle_orm.sql`YEAR(${import_schema.visits.createdAt})`, year));
    }
  }
  let baseQuery = import_db.db.select({
    id: import_schema.visits.id,
    lat: import_schema.visits.lat,
    lng: import_schema.visits.lng,
    name: import_schema.visits.name,
    owner_name: import_schema.visits.owner_name,
    owner_phone: import_schema.visits.owner_phone,
    address: import_schema.visits.address,
    notes: import_schema.visits.notes,
    phone: import_schema.visits.phone,
    points: import_schema.visits.points,
    status: import_schema.visits.status,
    visit_status: import_schema.visitStatus.name,
    status_id: import_schema.visits.status_id,
    sales_id: import_schema.users.id,
    sales: import_schema.users.name,
    sales_phone: import_schema.users.phone,
    products: import_schema.visits.products,
    createdAt: import_schema.visits.createdAt
  }).from(import_schema.visits).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.visits.sales_id, import_schema.users.id)).leftJoin(import_schema.visitStatus, (0, import_drizzle_orm.eq)(import_schema.visits.status_id, import_schema.visitStatus.id)).orderBy((0, import_drizzle_orm.desc)(import_schema.visits.createdAt)).$dynamic();
  let countQuery = import_db.db.select({ total: (0, import_drizzle_orm.count)() }).from(import_schema.visits).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.visits.sales_id, import_schema.users.id)).leftJoin(import_schema.visitStatus, (0, import_drizzle_orm.eq)(import_schema.visits.status_id, import_schema.visitStatus.id)).$dynamic();
  if (whereConditions.length > 0) {
    baseQuery = baseQuery.where((0, import_drizzle_orm.and)(...whereConditions));
    countQuery = countQuery.where((0, import_drizzle_orm.and)(...whereConditions));
  }
  const [allVisitsRaw, [{ total: totalCount }]] = await Promise.all([
    baseQuery.limit(limit).offset(offset),
    countQuery
  ]);
  const enrichedVisits = await enrichRecordsWithProducts(allVisitsRaw);
  const allVisits = enrichedVisits.map((visit) => ({
    ...visit,
    map_link: `https://www.google.com/maps/search/?api=1&query=${visit.lat},${visit.lng}`
  }));
  (0, import_response.SuccessResponse)(res, {
    allVisits,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  }, 200);
};
const getVisitsCounts = async (req, res) => {
  await getAllVisitsSchema.parseAsync({ query: req.query });
  const userRole = req.user?.role;
  const userId = req.user?.id;
  const querySalesId = req.query.sales_id;
  const queryStatusId = req.query.status_id;
  const search = req.query.search || "";
  const fromDateStr = req.query.from;
  const toDateStr = req.query.to;
  let whereConditions = [];
  let leadsWhereConditions = [];
  if (queryStatusId) {
    whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.status_id, queryStatusId));
  }
  if (userRole === "admin") {
    if (querySalesId) {
      whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, querySalesId));
      leadsWhereConditions.push((0, import_drizzle_orm.eq)(import_schema.leads.sales_id, querySalesId));
    }
  } else if (userRole === "leader") {
    const teamSales = await import_db.db.select({ id: import_schema.users.id }).from(import_schema.users).where(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales")),
        (0, import_drizzle_orm.eq)(import_schema.users.id, userId)
      )
    );
    const salesIds = teamSales.map((s) => s.id);
    const strictTeamIds = (await import_db.db.select({ id: import_schema.users.id }).from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales")))).map((s) => s.id);
    if (strictTeamIds.length > 0) {
      leadsWhereConditions.push((0, import_drizzle_orm.inArray)(import_schema.leads.sales_id, strictTeamIds));
    } else {
      leadsWhereConditions.push(import_drizzle_orm.sql`1 = 0`);
    }
    if (querySalesId) {
      if (salesIds.includes(querySalesId)) {
        whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, querySalesId));
      } else {
        throw new import_BadRequest.BadRequest("You do not have access to this sales member's visits.");
      }
    } else {
      if (salesIds.length > 0) {
        whereConditions.push((0, import_drizzle_orm.inArray)(import_schema.visits.sales_id, salesIds));
      } else {
        return (0, import_response.SuccessResponse)(res, { visitCount: 0, notVisitCount: 0, total: 0, leadsCount: 0 }, 200);
      }
    }
  } else if (userRole === "sales") {
    whereConditions.push((0, import_drizzle_orm.eq)(import_schema.visits.sales_id, userId));
    leadsWhereConditions.push((0, import_drizzle_orm.eq)(import_schema.leads.sales_id, userId));
  } else {
    throw new import_BadRequest.BadRequest("Unauthorized role");
  }
  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.like)(import_schema.visits.name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.visits.phone, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.email, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.phone, searchPattern)
      )
    );
  }
  if (fromDateStr) {
    const fromDate = /* @__PURE__ */ new Date(`${fromDateStr}T00:00:00.000Z`);
    if (!isNaN(fromDate.getTime())) {
      whereConditions.push((0, import_drizzle_orm.gte)(import_schema.visits.createdAt, fromDate));
    }
  }
  if (toDateStr) {
    const toDate = /* @__PURE__ */ new Date(`${toDateStr}T23:59:59.999Z`);
    if (!isNaN(toDate.getTime())) {
      whereConditions.push((0, import_drizzle_orm.lte)(import_schema.visits.createdAt, toDate));
    }
  }
  const [countsResult] = await import_db.db.select({
    visitCount: import_drizzle_orm.sql`COALESCE(COUNT(CASE WHEN ${import_schema.visits.status} = 'visit' THEN 1 END), 0)`,
    notVisitCount: import_drizzle_orm.sql`COALESCE(COUNT(CASE WHEN ${import_schema.visits.status} != 'visit' THEN 1 END), 0)`
  }).from(import_schema.visits).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.visits.sales_id, import_schema.users.id)).leftJoin(import_schema.visitStatus, (0, import_drizzle_orm.eq)(import_schema.visits.status_id, import_schema.visitStatus.id)).where(whereConditions.length > 0 ? (0, import_drizzle_orm.and)(...whereConditions) : void 0);
  const visitCount = Number(countsResult?.visitCount || 0);
  const notVisitCount = Number(countsResult?.notVisitCount || 0);
  const wishListsCount = (await import_db.db.select({
    id: import_schema.wishList.id
  }).from(import_schema.wishList)).length;
  const [{ totalLeads }] = await import_db.db.select({ totalLeads: (0, import_drizzle_orm.count)() }).from(import_schema.leads).where(leadsWhereConditions.length > 0 ? (0, import_drizzle_orm.and)(...leadsWhereConditions) : void 0);
  (0, import_response.SuccessResponse)(res, {
    visitCount,
    salesCount: notVisitCount,
    total: visitCount + notVisitCount,
    wishListsCount,
    leadsCount: Number(totalLeads || 0)
  }, 200);
};
const lists = async (req, res) => {
  const visit_status = await import_db.db.select({
    id: import_schema.visitStatus.id,
    name: import_schema.visitStatus.name
  }).from(import_schema.visitStatus).where((0, import_drizzle_orm.eq)(import_schema.visitStatus.status, true));
  const userId = req.user?.id;
  let sales = [];
  if (req.user?.role === "leader" && userId) {
    sales = await import_db.db.select({
      id: import_schema.users.id,
      name: import_schema.users.name,
      phone: import_schema.users.phone
    }).from(import_schema.users).where(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales")),
        (0, import_drizzle_orm.eq)(import_schema.users.id, userId)
      )
    );
  } else {
    sales = await import_db.db.select({
      id: import_schema.users.id,
      name: import_schema.users.name,
      phone: import_schema.users.phone
    }).from(import_schema.users);
  }
  (0, import_response.SuccessResponse)(res, { visit_status, sales }, 200);
};
const getVisitsById = async (req, res) => {
  const validated = await VisitIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const visitRaw = await import_db.db.select({
    id: import_schema.visits.id,
    lat: import_schema.visits.lat,
    lng: import_schema.visits.lng,
    name: import_schema.visits.name,
    owner_name: import_schema.visits.owner_name,
    owner_phone: import_schema.visits.owner_phone,
    address: import_schema.visits.address,
    notes: import_schema.visits.notes,
    phone: import_schema.visits.phone,
    points: import_schema.visits.points,
    status: import_schema.visits.status,
    status_id: import_schema.visits.status_id,
    sales_id: import_schema.visits.sales_id,
    products: import_schema.visits.products
  }).from(import_schema.visits).where((0, import_drizzle_orm.eq)(import_schema.visits.id, id)).limit(1);
  if (!visitRaw[0]) {
    throw new import_NotFound.NotFound("Visit not found");
  }
  if (req.user?.role === "sales" && visitRaw[0].sales_id !== req.user.id) {
    throw new import_BadRequest.BadRequest("You do not have permission to access this visit.");
  }
  const [enriched] = await enrichRecordsWithProducts([visitRaw[0]]);
  const visit = {
    ...enriched,
    map_link: `https://www.google.com/maps/search/?api=1&query=${visitRaw[0].lat},${visitRaw[0].lng}`
  };
  (0, import_response.SuccessResponse)(res, { Visit: visit }, 200);
};
const createVisits = async (req, res) => {
  const validated = await createVisitSchema(req.user?.role).parseAsync({ body: req.body });
  const { lat, lng, name, address, notes, phone, status_id, owner_name, owner_phone } = validated.body;
  let status = "visit";
  if ((req.user?.role === "leader" || req.user?.role === "admin") && req.body.status) {
    status = req.body.status;
  }
  let sales_id;
  if (req.user?.role === "sales") {
    sales_id = req.user.id;
  } else if (req.user?.role === "leader") {
    sales_id = validated.body.sales_id || req.user.id;
  } else {
    sales_id = validated.body.sales_id;
  }
  if (!sales_id) {
    throw new import_BadRequest.BadRequest("sales_id is required.");
  }
  const salesExist = await import_db.db.select({ id: import_schema.users.id }).from(import_schema.users).where(
    (0, import_drizzle_orm.and)(
      (0, import_drizzle_orm.eq)(import_schema.users.id, sales_id),
      (0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(import_schema.users.role, "sales"), (0, import_drizzle_orm.eq)(import_schema.users.role, "leader"))
    )
  ).limit(1);
  if (!salesExist[0]) {
    throw new import_BadRequest.BadRequest("The assigned sales_id does not exist or user is not a sales member/leader.");
  }
  if (status_id) {
    const statusExist = await import_db.db.select({ id: import_schema.visitStatus.id }).from(import_schema.visitStatus).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.visitStatus.id, status_id), (0, import_drizzle_orm.eq)(import_schema.visitStatus.status, true))).limit(1);
    if (!statusExist[0]) {
      throw new import_BadRequest.BadRequest("The assigned status_id does not exist or is inactive.");
    }
  }
  let visitProducts = [];
  if (validated.body.products && Array.isArray(validated.body.products)) {
    visitProducts = parseProductsArray(validated.body.products);
  } else if (validated.body.product_id) {
    visitProducts = [{
      product_id: validated.body.product_id,
      duration: validated.body.duration || ""
    }];
  }
  const insertData = {
    lat,
    lng,
    name,
    owner_name: owner_name || null,
    owner_phone: owner_phone || null,
    address,
    notes: notes || null,
    phone,
    status,
    status_id: status_id || null,
    sales_id,
    products: visitProducts,
    points: 0
  };
  if ((status === "sales" || status === "delivered") && visitProducts.length > 0 && (req.user?.role === "leader" || req.user?.role === "admin")) {
    insertData.points = await calculatePointsForProducts(visitProducts);
  }
  await import_db.db.insert(import_schema.visits).values(insertData);
  (0, import_response.SuccessResponse)(res, { message: "Visit created successfully" }, 201);
};
const updateVisits = async (req, res) => {
  const validated = await updateVisitSchema.parseAsync({
    params: req.params,
    body: req.body
  });
  const { id } = validated.params;
  const { lat, lng, name, address, notes, phone, status, status_id, owner_name, owner_phone } = validated.body;
  const existingVisit = await import_db.db.select().from(import_schema.visits).where((0, import_drizzle_orm.eq)(import_schema.visits.id, id)).limit(1);
  const currentVisit = existingVisit[0];
  if (!currentVisit) {
    throw new import_NotFound.NotFound("Visit not found");
  }
  if (req.user?.role === "sales" && currentVisit.sales_id !== req.user.id) {
    throw new import_BadRequest.BadRequest("You do not have permission to modify this visit.");
  }
  let sales_id = req.body.sales_id;
  if (sales_id !== void 0 && sales_id !== null) {
    const salesExist = await import_db.db.select({ id: import_schema.users.id }).from(import_schema.users).where((0, import_drizzle_orm.and)(
      (0, import_drizzle_orm.eq)(import_schema.users.id, sales_id),
      (0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(import_schema.users.role, "sales"), (0, import_drizzle_orm.eq)(import_schema.users.role, "leader"))
    )).limit(1);
    if (!salesExist[0]) {
      throw new import_BadRequest.BadRequest("The updated sales_id does not exist.");
    }
  }
  if (status_id !== void 0 && status_id !== null) {
    const statusExist = await import_db.db.select({ id: import_schema.visitStatus.id }).from(import_schema.visitStatus).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.visitStatus.id, status_id), (0, import_drizzle_orm.eq)(import_schema.visitStatus.status, true))).limit(1);
    if (!statusExist[0]) {
      throw new import_BadRequest.BadRequest("The updated status_id does not exist.");
    }
  }
  const updateData = {};
  if (lat !== void 0) updateData.lat = lat;
  if (lng !== void 0) updateData.lng = lng;
  if (name !== void 0) updateData.name = name;
  if (owner_name !== void 0) updateData.owner_name = owner_name || null;
  if (owner_phone !== void 0) updateData.owner_phone = owner_phone || null;
  if (address !== void 0) updateData.address = address;
  if (notes !== void 0) updateData.notes = notes;
  if (phone !== void 0) updateData.phone = phone;
  if (status_id !== void 0) updateData.status_id = status_id;
  if (sales_id !== void 0 && req.user?.role !== "sales") updateData.sales_id = sales_id;
  if (validated.body.products !== void 0) {
    updateData.products = parseProductsArray(validated.body.products);
  } else if (validated.body.product_id !== void 0 && validated.body.product_id) {
    updateData.products = [{
      product_id: validated.body.product_id,
      duration: validated.body.duration || ""
    }];
  }
  const effectiveProducts = updateData.products !== void 0 ? updateData.products : parseProductsArray(currentVisit.products);
  if (status !== void 0) {
    if (req.user?.role === "sales") {
      if (!req.user.id) {
        throw new import_BadRequest.BadRequest("User ID is missing.");
      }
      const request_item = await import_db.db.select({ id: import_schema.statusRequest.id }).from(import_schema.statusRequest).where(
        (0, import_drizzle_orm.and)(
          (0, import_drizzle_orm.eq)(import_schema.statusRequest.visitId, currentVisit.id),
          (0, import_drizzle_orm.eq)(import_schema.statusRequest.from, currentVisit.status),
          (0, import_drizzle_orm.eq)(import_schema.statusRequest.to, status),
          (0, import_drizzle_orm.eq)(import_schema.statusRequest.userId, req.user.id),
          (0, import_drizzle_orm.eq)(import_schema.statusRequest.status, "pending")
        )
      ).limit(1);
      if (!request_item[0]) {
        await import_db.db.insert(import_schema.statusRequest).values({
          visitId: currentVisit.id,
          from: currentVisit.status,
          to: status,
          userId: req.user.id,
          status: "pending"
        });
      }
    } else {
      updateData.status = status;
      if (status === "sales" || status === "delivered") {
        updateData.points = await calculatePointsForProducts(effectiveProducts);
      } else {
        updateData.points = 0;
      }
    }
  } else if (updateData.products !== void 0 && req.user?.role !== "sales") {
    if (currentVisit.status === "sales" || currentVisit.status === "delivered") {
      updateData.points = await calculatePointsForProducts(effectiveProducts);
    }
  }
  let updateConditions = (0, import_drizzle_orm.eq)(import_schema.visits.id, id);
  if (req.user?.role === "sales") {
    updateConditions = (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.visits.id, id), (0, import_drizzle_orm.eq)(import_schema.visits.sales_id, req.user.id));
  }
  if (Object.keys(updateData).length > 0) {
    await import_db.db.update(import_schema.visits).set(updateData).where(updateConditions);
  }
  (0, import_response.SuccessResponse)(res, { message: "Visit updated successfully" }, 200);
};
const deleteVisits = async (req, res) => {
  const validated = await VisitIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const existingVisit = await import_db.db.select().from(import_schema.visits).where((0, import_drizzle_orm.eq)(import_schema.visits.id, id)).limit(1);
  if (!existingVisit[0]) {
    throw new import_NotFound.NotFound("Visit not found");
  }
  let deleteConditions = (0, import_drizzle_orm.eq)(import_schema.visits.id, id);
  if (req.user?.role === "leader" || req.user?.role === "sales") {
    deleteConditions = (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.visits.id, id), (0, import_drizzle_orm.eq)(import_schema.visits.sales_id, req.user.id));
  }
  await import_db.db.delete(import_schema.visits).where(deleteConditions);
  (0, import_response.SuccessResponse)(res, { message: "Visit deleted successfully" }, 200);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VisitIdSchema,
  calculatePointsForProducts,
  createVisitSchema,
  createVisits,
  deleteVisits,
  enrichRecordsWithProducts,
  getAllSales,
  getAllVisits,
  getAllVisitsSchema,
  getVisitsById,
  getVisitsCounts,
  lists,
  parseProductsArray,
  updateVisitSchema,
  updateVisits
});
