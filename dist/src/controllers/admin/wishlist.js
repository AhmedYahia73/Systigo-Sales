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
  WishListIdSchema: () => WishListIdSchema,
  convertWishListSchema: () => convertWishListSchema,
  convertWishListToVisit: () => convertWishListToVisit,
  createWishListSchema: () => createWishListSchema,
  createWishLists: () => createWishLists,
  deleteWishLists: () => deleteWishLists,
  getAllWishListSchema: () => getAllWishListSchema,
  getAllWishLists: () => getAllWishLists,
  getWishListsById: () => getWishListsById,
  lists: () => lists,
  updateWishListSchema: () => updateWishListSchema,
  updateWishLists: () => updateWishLists
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_drizzle_orm = require("drizzle-orm");
var import_response = require("../../utils/response");
var import_NotFound = require("../../Errors/NotFound");
var import_BadRequest = require("../../Errors/BadRequest");
var import_zod = require("zod");
var import_visits = require("./visits");
const wishListProductItemSchema = import_zod.z.object({
  product_id: import_zod.z.string({ required_error: "Product ID is required" }).min(1, "Product ID cannot be empty"),
  duration: import_zod.z.string().optional().default("")
});
const createWishListSchema = import_zod.z.object({
  body: import_zod.z.object({
    name: import_zod.z.string({ required_error: "Name is required" }).min(1, "Name cannot be empty").max(255, "Name cannot exceed 255 characters"),
    description: import_zod.z.string().max(1e3, "Description cannot exceed 1000 characters").nullable().optional(),
    sales_id: import_zod.z.string().uuid("Invalid sales ID format").nullable().optional()
  })
});
const updateWishListSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format")
  }),
  body: import_zod.z.object({
    name: import_zod.z.string().min(1, "Name cannot be empty").max(255).optional(),
    description: import_zod.z.string().max(1e3, "Description cannot exceed 1000 characters").nullable().optional(),
    sales_id: import_zod.z.string().uuid("Invalid sales ID format").nullable().optional()
  })
});
const WishListIdSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format")
  })
});
const getAllWishListSchema = import_zod.z.object({
  query: import_zod.z.object({
    page: import_zod.z.coerce.number().int().positive().optional(),
    limit: import_zod.z.coerce.number().int().positive().optional(),
    search: import_zod.z.string().optional(),
    sales_id: import_zod.z.string().optional()
  })
});
const convertWishListSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format")
  }),
  body: import_zod.z.object({
    lat: import_zod.z.coerce.number({ required_error: "Latitude (lat) is required" }).min(-90).max(90),
    lng: import_zod.z.coerce.number({ required_error: "Longitude (lng) is required" }).min(-180).max(180),
    address: import_zod.z.string({ required_error: "Address is required" }).min(1, "Address cannot be empty").max(500),
    owner_name: import_zod.z.string().max(255).nullable().optional(),
    owner_phone: import_zod.z.string().max(20).nullable().optional(),
    notes: import_zod.z.string().max(1e3).nullable().optional(),
    phone: import_zod.z.string({ required_error: "Phone is required" }).min(5, "Phone number is too short").max(20),
    status_id: import_zod.z.string({ required_error: "Status ID is required" }).min(1, "Status ID cannot be empty"),
    products: import_zod.z.array(wishListProductItemSchema).nullable().optional()
  })
});
const lists = async (req, res) => {
  const userId = req.user?.id;
  let sales = [];
  if (req.user?.role === "leader" && userId) {
    sales = await import_db.db.select({
      id: import_schema.users.id,
      name: import_schema.users.name
    }).from(import_schema.users).where(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.users.leader_id, userId), (0, import_drizzle_orm.eq)(import_schema.users.role, "sales")),
        (0, import_drizzle_orm.eq)(import_schema.users.id, userId)
      )
    );
  } else {
    sales = await import_db.db.select({
      id: import_schema.users.id,
      name: import_schema.users.name
    }).from(import_schema.users).where((0, import_drizzle_orm.eq)(import_schema.users.role, "sales"));
  }
  const [visit_status, allProducts] = await Promise.all([
    import_db.db.select({
      id: import_schema.visitStatus.id,
      name: import_schema.visitStatus.name
    }).from(import_schema.visitStatus).where((0, import_drizzle_orm.eq)(import_schema.visitStatus.status, true)),
    import_db.db.select({
      id: import_schema.products.id,
      name: import_schema.products.name,
      points: import_schema.products.points
    }).from(import_schema.products)
  ]);
  (0, import_response.SuccessResponse)(res, { sales, visit_status, products: allProducts }, 200);
};
const getAllWishLists = async (req, res) => {
  await getAllWishListSchema.parseAsync({ query: req.query });
  const userRole = req.user?.role;
  const userId = req.user?.id;
  const querySalesId = req.query.sales_id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const offset = (page - 1) * limit;
  let whereConditions = [];
  if (userRole === "admin") {
    if (querySalesId) {
      whereConditions.push((0, import_drizzle_orm.eq)(import_schema.wishList.sales_id, querySalesId));
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
        whereConditions.push((0, import_drizzle_orm.eq)(import_schema.wishList.sales_id, querySalesId));
      } else {
        throw new import_BadRequest.BadRequest("You do not have access to this sales member's wishlists.");
      }
    } else if (salesIds.length > 0) {
      whereConditions.push((0, import_drizzle_orm.inArray)(import_schema.wishList.sales_id, salesIds));
    }
  } else if (userRole === "sales") {
    whereConditions.push((0, import_drizzle_orm.eq)(import_schema.wishList.sales_id, userId));
  }
  if (search) {
    const searchPattern = `%${search}%`;
    whereConditions.push(
      (0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.like)(import_schema.wishList.name, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.wishList.description, searchPattern),
        (0, import_drizzle_orm.like)(import_schema.users.name, searchPattern)
      )
    );
  }
  let query = import_db.db.select({
    id: import_schema.wishList.id,
    name: import_schema.wishList.name,
    description: import_schema.wishList.description,
    sales_id: import_schema.wishList.sales_id,
    sales: import_schema.users.name,
    createdAt: import_schema.wishList.createdAt
  }).from(import_schema.wishList).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.wishList.sales_id, import_schema.users.id)).orderBy((0, import_drizzle_orm.desc)(import_schema.wishList.createdAt)).$dynamic();
  let countQuery = import_db.db.select({ total: (0, import_drizzle_orm.count)() }).from(import_schema.wishList).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.wishList.sales_id, import_schema.users.id)).$dynamic();
  if (whereConditions.length > 0) {
    query = query.where((0, import_drizzle_orm.and)(...whereConditions));
    countQuery = countQuery.where((0, import_drizzle_orm.and)(...whereConditions));
  }
  const [allWishLists, [{ total: totalCount }]] = await Promise.all([
    query.limit(limit).offset(offset),
    countQuery
  ]);
  (0, import_response.SuccessResponse)(res, {
    allWishLists,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  }, 200);
};
const getWishListsById = async (req, res) => {
  const validated = await WishListIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const WishLists = await import_db.db.select({
    id: import_schema.wishList.id,
    name: import_schema.wishList.name,
    description: import_schema.wishList.description,
    sales_id: import_schema.wishList.sales_id,
    sales: import_schema.users.name
  }).from(import_schema.wishList).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.wishList.sales_id, import_schema.users.id)).where((0, import_drizzle_orm.eq)(import_schema.wishList.id, id)).limit(1);
  if (!WishLists[0]) {
    throw new import_NotFound.NotFound("WishList not found");
  }
  (0, import_response.SuccessResponse)(res, { WishList: WishLists[0] }, 200);
};
const createWishLists = async (req, res) => {
  const validated = await createWishListSchema.parseAsync({ body: req.body });
  const { name, description } = validated.body;
  let sales_id = null;
  if (req.user?.role === "sales") {
    sales_id = req.user.id;
  } else if (req.user?.role === "leader") {
    sales_id = validated.body.sales_id || req.user.id;
  } else {
    sales_id = validated.body.sales_id || null;
  }
  if (sales_id) {
    const salesExist = await import_db.db.select({ id: import_schema.users.id }).from(import_schema.users).where((0, import_drizzle_orm.eq)(import_schema.users.id, sales_id)).limit(1);
    if (!salesExist[0]) {
      throw new import_BadRequest.BadRequest("The assigned sales_id does not exist.");
    }
  }
  await import_db.db.insert(import_schema.wishList).values({
    name,
    description: description || null,
    sales_id
  });
  (0, import_response.SuccessResponse)(res, { message: "WishList created successfully" }, 201);
};
const updateWishLists = async (req, res) => {
  const validated = await updateWishListSchema.parseAsync({
    params: req.params,
    body: req.body
  });
  const { id } = validated.params;
  const { name, description, sales_id } = validated.body;
  const existingWishLists = await import_db.db.select().from(import_schema.wishList).where((0, import_drizzle_orm.eq)(import_schema.wishList.id, id)).limit(1);
  if (!existingWishLists[0]) {
    throw new import_NotFound.NotFound("WishList not found");
  }
  if (sales_id !== void 0 && sales_id !== null) {
    const salesExist = await import_db.db.select({ id: import_schema.users.id }).from(import_schema.users).where((0, import_drizzle_orm.eq)(import_schema.users.id, sales_id)).limit(1);
    if (!salesExist[0]) {
      throw new import_BadRequest.BadRequest("The updated sales_id does not exist.");
    }
  }
  const updateData = {};
  if (name !== void 0) updateData.name = name;
  if (description !== void 0) updateData.description = description;
  if (sales_id !== void 0) updateData.sales_id = sales_id;
  await import_db.db.update(import_schema.wishList).set(updateData).where((0, import_drizzle_orm.eq)(import_schema.wishList.id, id));
  (0, import_response.SuccessResponse)(res, { message: "WishList updated successfully" }, 200);
};
const deleteWishLists = async (req, res) => {
  const validated = await WishListIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const existingWishLists = await import_db.db.select().from(import_schema.wishList).where((0, import_drizzle_orm.eq)(import_schema.wishList.id, id)).limit(1);
  if (!existingWishLists[0]) {
    throw new import_NotFound.NotFound("WishList not found");
  }
  await import_db.db.delete(import_schema.wishList).where((0, import_drizzle_orm.eq)(import_schema.wishList.id, id));
  (0, import_response.SuccessResponse)(res, { message: "WishList deleted successfully" }, 200);
};
const convertWishListToVisit = async (req, res) => {
  const validated = await convertWishListSchema.parseAsync({
    params: req.params,
    body: req.body
  });
  const { id } = validated.params;
  const {
    lat,
    lng,
    address,
    owner_name,
    owner_phone,
    notes,
    phone,
    status_id,
    products: bodyProducts
  } = validated.body;
  const role = req.user?.role;
  const userId = req.user?.id;
  const existingRows = await import_db.db.select({
    item: import_schema.wishList,
    leader_id: import_schema.users.leader_id
  }).from(import_schema.wishList).leftJoin(import_schema.users, (0, import_drizzle_orm.eq)(import_schema.wishList.sales_id, import_schema.users.id)).where((0, import_drizzle_orm.eq)(import_schema.wishList.id, id)).limit(1);
  if (!existingRows[0]) {
    throw new import_NotFound.NotFound("WishList not found");
  }
  const existingItem = existingRows[0].item;
  const existingLeaderId = existingRows[0].leader_id;
  if (role === "sales" && existingItem.sales_id && existingItem.sales_id !== userId) {
    throw new import_BadRequest.BadRequest("You do not have permission to convert this wish list.");
  }
  if (role === "leader" && existingItem.sales_id && existingItem.sales_id !== userId && existingLeaderId !== userId) {
    throw new import_BadRequest.BadRequest("You do not have permission to convert this wish list.");
  }
  const finalSalesId = existingItem.sales_id || userId;
  if (!finalSalesId) {
    throw new import_BadRequest.BadRequest("WishList has no assigned sales_id.");
  }
  const statusExist = await import_db.db.select({ id: import_schema.visitStatus.id }).from(import_schema.visitStatus).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(import_schema.visitStatus.id, status_id), (0, import_drizzle_orm.eq)(import_schema.visitStatus.status, true))).limit(1);
  if (!statusExist[0]) {
    throw new import_BadRequest.BadRequest("The assigned status_id does not exist or is inactive.");
  }
  const visitProducts = (0, import_visits.parseProductsArray)(bodyProducts);
  await import_db.db.transaction(async (tx) => {
    await tx.insert(import_schema.visits).values({
      lat: Number(lat),
      lng: Number(lng),
      name: existingItem.name,
      sales_id: finalSalesId,
      address,
      owner_name: owner_name || null,
      owner_phone: owner_phone || null,
      notes: notes !== void 0 && notes !== null ? notes : existingItem.description || null,
      phone,
      status_id,
      points: 0,
      status: "visit",
      products: visitProducts
    });
    await tx.delete(import_schema.wishList).where((0, import_drizzle_orm.eq)(import_schema.wishList.id, id));
  });
  (0, import_response.SuccessResponse)(
    res,
    { message: "WishList converted to visit successfully" },
    200
  );
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  WishListIdSchema,
  convertWishListSchema,
  convertWishListToVisit,
  createWishListSchema,
  createWishLists,
  deleteWishLists,
  getAllWishListSchema,
  getAllWishLists,
  getWishListsById,
  lists,
  updateWishListSchema,
  updateWishLists
});
