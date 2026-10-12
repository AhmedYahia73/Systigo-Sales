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
  ProductIdSchema: () => ProductIdSchema,
  createProduct: () => createProduct,
  createProductSchema: () => createProductSchema,
  deleteProduct: () => deleteProduct,
  getAllProducts: () => getAllProducts,
  getProductById: () => getProductById,
  updateProduct: () => updateProduct,
  updateProductSchema: () => updateProductSchema
});
module.exports = __toCommonJS(stdin_exports);
var import_db = require("../../models/db");
var import_schema = require("../../models/schema");
var import_response = require("../../utils/response");
var import_NotFound = require("../../Errors/NotFound");
var import_zod = require("zod");
var import_drizzle_orm = require("drizzle-orm");
const pointSchema = import_zod.z.object({
  point: import_zod.z.number({ required_error: "Point value is required" }).min(0),
  duration: import_zod.z.string({ required_error: "Duration is required" })
});
const createProductSchema = import_zod.z.object({
  body: import_zod.z.object({
    name: import_zod.z.string({ required_error: "Name is required" }).min(1).max(255),
    feez: import_zod.z.number().optional().default(0),
    description: import_zod.z.string().max(1e3).optional().nullable(),
    demo_link: import_zod.z.string().max(200).optional().nullable(),
    points: import_zod.z.array(pointSchema, { required_error: "Points array is required" }).min(1)
  })
});
const updateProductSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required" })
  }),
  body: import_zod.z.object({
    name: import_zod.z.string().min(1).max(255).optional(),
    feez: import_zod.z.number().optional(),
    description: import_zod.z.string().max(1e3).optional().nullable(),
    demo_link: import_zod.z.string().max(200).optional().nullable(),
    points: import_zod.z.array(pointSchema).optional()
  })
});
const ProductIdSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string({ required_error: "ID is required" })
  })
});
const getAllProducts = async (req, res) => {
  const allProducts = await import_db.db.select().from(import_schema.products).orderBy((0, import_drizzle_orm.desc)(import_schema.products.createdAt));
  (0, import_response.SuccessResponse)(res, { allProducts }, 200);
};
const getProductById = async (req, res) => {
  const validated = await ProductIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const productRaw = await import_db.db.select().from(import_schema.products).where((0, import_drizzle_orm.eq)(import_schema.products.id, id)).limit(1);
  if (!productRaw[0]) {
    throw new import_NotFound.NotFound("Product not found");
  }
  (0, import_response.SuccessResponse)(res, { product: productRaw[0] }, 200);
};
const createProduct = async (req, res) => {
  const validated = await createProductSchema.parseAsync({ body: req.body });
  const { name, feez, description, demo_link, points } = validated.body;
  await import_db.db.insert(import_schema.products).values({
    name,
    feez,
    description: description || null,
    demo_link: demo_link || null,
    points
  });
  (0, import_response.SuccessResponse)(res, { message: "Product created successfully" }, 201);
};
const updateProduct = async (req, res) => {
  const validated = await updateProductSchema.parseAsync({
    params: req.params,
    body: req.body
  });
  const { id } = validated.params;
  const { name, feez, description, demo_link, points } = validated.body;
  const existingProduct = await import_db.db.select().from(import_schema.products).where((0, import_drizzle_orm.eq)(import_schema.products.id, id)).limit(1);
  if (!existingProduct[0]) {
    throw new import_NotFound.NotFound("Product not found");
  }
  const updateData = {};
  if (name !== void 0) updateData.name = name;
  if (feez !== void 0) updateData.feez = feez;
  if (description !== void 0) updateData.description = description;
  if (demo_link !== void 0) updateData.demo_link = demo_link;
  if (points !== void 0) updateData.points = points;
  if (Object.keys(updateData).length > 0) {
    await import_db.db.update(import_schema.products).set(updateData).where((0, import_drizzle_orm.eq)(import_schema.products.id, id));
  }
  (0, import_response.SuccessResponse)(res, { message: "Product updated successfully" }, 200);
};
const deleteProduct = async (req, res) => {
  const validated = await ProductIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params;
  const existingProduct = await import_db.db.select().from(import_schema.products).where((0, import_drizzle_orm.eq)(import_schema.products.id, id)).limit(1);
  if (!existingProduct[0]) {
    throw new import_NotFound.NotFound("Product not found");
  }
  await import_db.db.delete(import_schema.products).where((0, import_drizzle_orm.eq)(import_schema.products.id, id));
  (0, import_response.SuccessResponse)(res, { message: "Product deleted successfully" }, 200);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ProductIdSchema,
  createProduct,
  createProductSchema,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  updateProductSchema
});
