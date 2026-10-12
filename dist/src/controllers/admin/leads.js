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
  convertLeadSchema: () => convertLeadSchema,
  convertLeadToVisit: () => convertLeadToVisit,
  createLead: () => createLead,
  createLeadSchema: () => createLeadSchema,
  deleteLead: () => deleteLead,
  getAllLeads: () => getAllLeads,
  getLeadById: () => getLeadById,
  leadIdSchema: () => leadIdSchema,
  lists: () => lists,
  updateLead: () => updateLead,
  updateLeadSchema: () => updateLeadSchema
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_drizzle_orm = require("drizzle-orm");
var import_BadRequest = require("../../Errors/BadRequest");
var import_Errors = require("../../Errors");
var import_response = require("../../utils/response");
var import_zod = require("zod");
var import_visits = require("./visits");
const leadProductItemSchema = import_zod.z.object({
  product_id: import_zod.z.string({ required_error: "Product ID is required" }).min(1, "Product ID cannot be empty"),
  duration: import_zod.z.string().optional().default("")
});
const createLeadSchema = (userRole) => import_zod.z.object({
  body: import_zod.z.object({
    name: import_zod.z.string({ required_error: "Name is required" }).min(1, "Name cannot be empty").max(255, "Name cannot exceed 255 characters"),
    phone: import_zod.z.string({ required_error: "Phone is required" }).min(5, "Phone number is too short").max(20, "Phone cannot exceed 20 characters"),
    sales_id: userRole === "sales" ? import_zod.z.string().uuid("Invalid Sales ID format").optional() : import_zod.z.string({ required_error: "Sales ID is required" }).uuid("Invalid Sales ID format"),
    place_name: import_zod.z.string().max(255).nullable().optional(),
    place_phone: import_zod.z.string().max(20).nullable().optional(),
    lat: import_zod.z.coerce.number({ required_error: "Latitude (lat) is required" }).min(-90).max(90),
    lng: import_zod.z.coerce.number({ required_error: "Longitude (lng) is required" }).min(-180).max(180),
    address: import_zod.z.string({ required_error: "Address is required" }).min(1, "Address cannot be empty").max(500, "Address cannot exceed 500 characters"),
    notes: import_zod.z.string().max(1e3).nullable().optional(),
    products: import_zod.z.array(leadProductItemSchema).nullable().optional(),
    product_id: import_zod.z.string().nullable().optional(),
    duration: import_zod.z.string().nullable().optional()
  })
});
const updateLeadSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "Lead ID is required" })
  }),
  body: import_zod.z.object({
    name: import_zod.z.string().min(1).max(255).optional(),
    phone: import_zod.z.string().min(5).max(20).optional(),
    sales_id: import_zod.z.string().uuid("Invalid Sales ID format").optional(),
    place_name: import_zod.z.string().max(255).nullable().optional(),
    place_phone: import_zod.z.string().max(20).nullable().optional(),
    lat: import_zod.z.coerce.number().min(-90).max(90).optional(),
    lng: import_zod.z.coerce.number().min(-180).max(180).optional(),
    address: import_zod.z.string().min(1).max(500).optional(),
    notes: import_zod.z.string().max(1e3).nullable().optional(),
    products: import_zod.z.array(leadProductItemSchema).nullable().optional(),
    product_id: import_zod.z.string().nullable().optional(),
    duration: import_zod.z.string().nullable().optional()
  })
});
const leadIdSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "Lead ID is required" })
  })
});
const convertLeadSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "Lead ID is required" })
  }),
  body: import_zod.z.object({
    status_id: import_zod.z.string({ required_error: "Status ID is required" }).min(1, "Status ID cannot be empty"),
    products: import_zod.z.array(leadProductItemSchema).optional()
  })
});
const validateProductsInput = async (rawProducts) => {
  const items = (0, import_visits.parseProductsArray)(rawProducts);
  for (const item of items) {
    const productExists = await import_db.db.select().from(import_schema.products).where((0, import_drizzle_orm.eq)(import_schema.products.id, item.product_id)).limit(1);
    if (productExists.length === 0) {
      throw new import_BadRequest.BadRequest(`Invalid product_id: ${item.product_id}`);
    }
  }
  return items;
};
const getAllLeads = async (req, res) => {
  const role = req.user?.role;
  const userId = req.user?.id;
  let baseCondition = void 0;
  if (role === "leader" && userId) {
    baseCondition = (0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId);
  } else if (role === "sales" && userId) {
    baseCondition = (0, import_drizzle_orm.eq)(import_schema.leads.sales_id, userId);
  }
  const allLeads = await import_db.db.select({
    id: import_schema.leads.id,
    name: import_schema.leads.name,
    phone: import_schema.leads.phone,
    sales_id: import_schema.leads.sales_id,
    sales: import_schema.users.name,
    sales_phone: import_schema.users.phone,
    leader_id: import_schema.users.leader_id,
    place_name: import_schema.leads.place_name,
    place_phone: import_schema.leads.place_phone,
    lat: import_schema.leads.lat,
    lng: import_schema.leads.lng,
    address: import_schema.leads.address,
    notes: import_schema.leads.notes,
    products: import_schema.leads.products,
    createdAt: import_schema.leads.createdAt,
    updatedAt: import_schema.leads.updatedAt
  }).from(import_schema.leads).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.leads.sales_id, import_schema.users.id)).where(baseCondition);
  const enriched = await (0, import_visits.enrichRecordsWithProducts)(allLeads);
  const leadsWithLinks = enriched.map((l) => ({
    ...l,
    map_link: `https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}`
  }));
  (0, import_response.SuccessResponse)(
    res,
    { allLeads: leadsWithLinks, leads: leadsWithLinks },
    200
  );
};
const lists = async (req, res) => {
  const role = req.user?.role;
  const userId = req.user?.id;
  let salesList = [];
  if (role === "admin") {
    salesList = await import_db.db.select({
      id: import_schema.users.id,
      name: import_schema.users.name
    }).from(import_schema.users).where((0, import_drizzle_orm.eq)(import_schema.users.role, "sales"));
  } else if (role === "leader" && userId) {
    salesList = await import_db.db.select({
      id: import_schema.users.id,
      name: import_schema.users.name
    }).from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.role, "sales"), (0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId)));
  }
  const [allProducts, visit_status] = await Promise.all([
    import_db.db.select({
      id: import_schema.products.id,
      name: import_schema.products.name,
      points: import_schema.products.points
    }).from(import_schema.products),
    import_db.db.select({
      id: import_schema.visitStatus.id,
      name: import_schema.visitStatus.name
    }).from(import_schema.visitStatus).where((0, import_drizzle_orm.eq)(import_schema.visitStatus.status, true))
  ]);
  (0, import_response.SuccessResponse)(res, { sales: salesList, products: allProducts, visit_status }, 200);
};
const getLeadById = async (req, res) => {
  const validated = await leadIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const role = req.user?.role;
  const userId = req.user?.id;
  const conditions = [(0, import_drizzle_orm.eq)(import_schema.leads.id, id)];
  if (role === "leader" && userId) {
    conditions.push((0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId));
  } else if (role === "sales" && userId) {
    conditions.push((0, import_drizzle_orm.eq)(import_schema.leads.sales_id, userId));
  }
  const rows = await import_db.db.select({
    id: import_schema.leads.id,
    name: import_schema.leads.name,
    phone: import_schema.leads.phone,
    sales_id: import_schema.leads.sales_id,
    sales: import_schema.users.name,
    sales_phone: import_schema.users.phone,
    leader_id: import_schema.users.leader_id,
    place_name: import_schema.leads.place_name,
    place_phone: import_schema.leads.place_phone,
    lat: import_schema.leads.lat,
    lng: import_schema.leads.lng,
    address: import_schema.leads.address,
    notes: import_schema.leads.notes,
    products: import_schema.leads.products,
    createdAt: import_schema.leads.createdAt,
    updatedAt: import_schema.leads.updatedAt
  }).from(import_schema.leads).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.leads.sales_id, import_schema.users.id)).where((0, import_drizzle_orm.and)(...conditions)).limit(1);
  if (rows.length === 0) throw new import_Errors.NotFound("Lead not found");
  const enriched = await (0, import_visits.enrichRecordsWithProducts)(rows);
  const lead = enriched[0];
  const leadWithMap = {
    ...lead,
    map_link: `https://www.google.com/maps/search/?api=1&query=${lead.lat},${lead.lng}`
  };
  (0, import_response.SuccessResponse)(res, { Lead: leadWithMap, lead: leadWithMap }, 200);
};
const createLead = async (req, res) => {
  const role = req.user?.role;
  const userId = req.user?.id;
  const validated = await createLeadSchema(role).parseAsync({ body: req.body });
  const {
    name,
    phone,
    sales_id: bodySalesId,
    place_name,
    place_phone,
    lat,
    lng,
    address,
    notes,
    products: bodyProducts,
    product_id,
    duration
  } = validated.body;
  let finalSalesId;
  if (role === "sales") {
    finalSalesId = userId;
  } else {
    finalSalesId = bodySalesId;
  }
  if (!finalSalesId) {
    throw new import_BadRequest.BadRequest("sales_id is required");
  }
  const salesUser = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.id, finalSalesId), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales"))).limit(1);
  if (salesUser.length === 0) {
    throw new import_BadRequest.BadRequest("Invalid sales_id \u2014 user not found or not a sales user");
  }
  if (role === "leader" && salesUser[0].leader_id !== userId) {
    throw new import_BadRequest.BadRequest("You can only assign leads to sales users under your team");
  }
  const rawProductsInput = bodyProducts !== void 0 ? bodyProducts : product_id ? [{ product_id, duration: duration || "" }] : [];
  const validatedProducts = await validateProductsInput(rawProductsInput);
  await import_db.db.insert(import_schema.leads).values({
    name,
    phone,
    sales_id: finalSalesId,
    place_name: place_name || null,
    place_phone: place_phone || null,
    lat: Number(lat),
    lng: Number(lng),
    address,
    notes: notes || null,
    products: validatedProducts
  });
  (0, import_response.SuccessResponse)(res, { message: "Lead created successfully" }, 201);
};
const updateLead = async (req, res) => {
  const validated = await updateLeadSchema.parseAsync({
    params: req.params,
    body: req.body
  });
  const { id } = validated.params;
  const role = req.user?.role;
  const userId = req.user?.id;
  const existingRows = await import_db.db.select({
    lead: import_schema.leads,
    leader_id: import_schema.users.leader_id
  }).from(import_schema.leads).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.leads.sales_id, import_schema.users.id)).where((0, import_drizzle_orm.eq)(import_schema.leads.id, id)).limit(1);
  if (existingRows.length === 0) {
    throw new import_Errors.NotFound("Lead not found");
  }
  const existingLead = existingRows[0].lead;
  const existingLeaderId = existingRows[0].leader_id;
  if (role === "leader" && existingLeaderId !== userId) {
    throw new import_Errors.NotFound("Lead not found or unauthorized");
  }
  if (role === "sales" && existingLead.sales_id !== userId) {
    throw new import_Errors.NotFound("Lead not found or unauthorized");
  }
  const {
    name,
    phone,
    sales_id: bodySalesId,
    place_name,
    place_phone,
    lat,
    lng,
    address,
    notes,
    products: bodyProducts,
    product_id,
    duration
  } = validated.body;
  let finalSalesId = void 0;
  if (role === "sales") {
    finalSalesId = userId;
  } else if (bodySalesId !== void 0) {
    const salesUser = await import_db.db.select().from(import_schema.users).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.id, bodySalesId), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales"))).limit(1);
    if (salesUser.length === 0) {
      throw new import_BadRequest.BadRequest("Invalid sales_id \u2014 user not found or not a sales user");
    }
    if (role === "leader" && salesUser[0].leader_id !== userId) {
      throw new import_BadRequest.BadRequest("You can only assign leads to sales users under your team");
    }
    finalSalesId = bodySalesId;
  }
  let validatedProducts = void 0;
  if (bodyProducts !== void 0) {
    validatedProducts = await validateProductsInput(bodyProducts);
  } else if (product_id !== void 0) {
    validatedProducts = await validateProductsInput(
      product_id ? [{ product_id, duration: duration || "" }] : []
    );
  }
  const updateData = {
    name: name ?? existingLead.name,
    phone: phone ?? existingLead.phone,
    sales_id: finalSalesId ?? existingLead.sales_id,
    place_name: place_name !== void 0 ? place_name : existingLead.place_name,
    place_phone: place_phone !== void 0 ? place_phone : existingLead.place_phone,
    lat: lat !== void 0 ? Number(lat) : existingLead.lat,
    lng: lng !== void 0 ? Number(lng) : existingLead.lng,
    address: address ?? existingLead.address,
    notes: notes !== void 0 ? notes : existingLead.notes,
    products: validatedProducts !== void 0 ? validatedProducts : existingLead.products
  };
  await import_db.db.update(import_schema.leads).set(updateData).where((0, import_drizzle_orm.eq)(import_schema.leads.id, id));
  (0, import_response.SuccessResponse)(res, { message: "Lead updated successfully" }, 200);
};
const deleteLead = async (req, res) => {
  const validated = await leadIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const role = req.user?.role;
  const userId = req.user?.id;
  const existingRows = await import_db.db.select({
    lead: import_schema.leads,
    leader_id: import_schema.users.leader_id
  }).from(import_schema.leads).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.leads.sales_id, import_schema.users.id)).where((0, import_drizzle_orm.eq)(import_schema.leads.id, id)).limit(1);
  if (existingRows.length === 0) {
    throw new import_Errors.NotFound("Lead not found");
  }
  const existingLead = existingRows[0].lead;
  const existingLeaderId = existingRows[0].leader_id;
  if (role === "leader" && existingLeaderId !== userId) {
    throw new import_Errors.NotFound("Lead not found or unauthorized");
  }
  if (role === "sales" && existingLead.sales_id !== userId) {
    throw new import_Errors.NotFound("Lead not found or unauthorized");
  }
  await import_db.db.delete(import_schema.leads).where((0, import_drizzle_orm.eq)(import_schema.leads.id, id));
  (0, import_response.SuccessResponse)(res, { message: "Lead deleted successfully" }, 200);
};
const convertLeadToVisit = async (req, res) => {
  const validated = await convertLeadSchema.parseAsync({
    params: req.params,
    body: req.body || {}
  });
  const { id } = validated.params;
  const { status_id } = validated.body;
  const role = req.user?.role;
  const userId = req.user?.id;
  const existingRows = await import_db.db.select({
    lead: import_schema.leads,
    leader_id: import_schema.users.leader_id
  }).from(import_schema.leads).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.leads.sales_id, import_schema.users.id)).where((0, import_drizzle_orm.eq)(import_schema.leads.id, id)).limit(1);
  if (existingRows.length === 0) {
    throw new import_Errors.NotFound("Lead not found");
  }
  const lead = existingRows[0].lead;
  const existingLeaderId = existingRows[0].leader_id;
  if (role === "leader" && existingLeaderId !== userId) {
    throw new import_Errors.NotFound("Lead not found or unauthorized");
  }
  if (role === "sales" && lead.sales_id !== userId) {
    throw new import_Errors.NotFound("Lead not found or unauthorized");
  }
  const statusRecord = await import_db.db.select({ id: import_schema.visitStatus.id }).from(import_schema.visitStatus).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.visitStatus.id, status_id), (0, import_drizzle_orm.eq)(import_schema.visitStatus.status, true))).limit(1);
  if (statusRecord.length === 0) {
    throw new import_BadRequest.BadRequest("Invalid or inactive status_id");
  }
  const leadProducts = (0, import_visits.parseProductsArray)(
    validated.body?.products !== void 0 ? validated.body.products : lead.products
  );
  await import_db.db.transaction(async (tx) => {
    await tx.insert(import_schema.visits).values({
      lat: lead.lat,
      lng: lead.lng,
      name: lead.name,
      phone: lead.phone,
      sales_id: lead.sales_id,
      owner_name: lead.place_name || null,
      owner_phone: lead.place_phone || null,
      address: lead.address,
      notes: lead.notes || null,
      status_id,
      points: 0,
      status: "visit",
      products: leadProducts
    });
    await tx.delete(import_schema.leads).where((0, import_drizzle_orm.eq)(import_schema.leads.id, id));
  });
  (0, import_response.SuccessResponse)(
    res,
    { message: "Lead converted to visit successfully" },
    200
  );
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  convertLeadSchema,
  convertLeadToVisit,
  createLead,
  createLeadSchema,
  deleteLead,
  getAllLeads,
  getLeadById,
  leadIdSchema,
  lists,
  updateLead,
  updateLeadSchema
});
