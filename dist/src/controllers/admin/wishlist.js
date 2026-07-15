"use strict";
// src/controllers/Sales/SalesController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWishLists = exports.updateWishLists = exports.createWishLists = exports.getWishListsById = exports.getAllWishLists = exports.WishListIdSchema = exports.updateWishListSchema = exports.createWishListSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const zod_1 = require("zod");
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
// الـ Schema الخاص بإنشاء WishList جديد
exports.createWishListSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: "Name is required" })
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters"),
        description: zod_1.z.string().max(255, "Description cannot exceed 255 characters").nullable().optional(),
    }),
});
// الـ Schema الخاص بتحديث WishList
exports.updateWishListSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format"), // تم التحقق كـ UUID ليتطابق مع المعايير الشائعة
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name cannot be empty").max(255).optional(),
        description: zod_1.z.string().max(255, "Description cannot exceed 255 characters").nullable().optional(),
    }),
});
// الـ Schema الخاص بالعمليات التي تتطلب ID فقط
exports.WishListIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format"),
    }),
});
// ==========================================
// 🎮 Controllers
// ==========================================
// ✅ Get All WishLists
const getAllWishLists = async (req, res) => {
    // ⚠️ تم إضافة await هنا لحل مشكلة عدم جلب البيانات الفعلي من قاعدة البيانات
    const allWishLists = await db_1.db
        .select({
        id: schema_1.wishList.id,
        name: schema_1.wishList.name,
        description: schema_1.wishList.description,
    })
        .from(schema_1.wishList);
    (0, response_1.SuccessResponse)(res, { allWishLists }, 200);
};
exports.getAllWishLists = getAllWishLists;
// ✅ Get WishLists By ID
const getWishListsById = async (req, res) => {
    const validated = await exports.WishListIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const WishLists = await db_1.db
        .select({
        id: schema_1.wishList.id,
        name: schema_1.wishList.name,
        description: schema_1.wishList.description,
    })
        .from(schema_1.wishList)
        .where((0, drizzle_orm_1.eq)(schema_1.wishList.id, id))
        .limit(1);
    if (!WishLists[0]) {
        throw new NotFound_1.NotFound("WishList not found");
    }
    (0, response_1.SuccessResponse)(res, { WishList: WishLists[0] }, 200);
};
exports.getWishListsById = getWishListsById;
// ✅ Create WishLists
const createWishLists = async (req, res) => {
    const validated = await exports.createWishListSchema.parseAsync({ body: req.body });
    const { name, description } = validated.body;
    await db_1.db.insert(schema_1.wishList).values({
        name,
        description: description || null,
    });
    (0, response_1.SuccessResponse)(res, { message: "WishList created successfully" }, 201);
};
exports.createWishLists = createWishLists;
// ✅ Update WishLists
const updateWishLists = async (req, res) => {
    const validated = await exports.updateWishListSchema.parseAsync({
        params: req.params,
        body: req.body
    });
    const { id } = validated.params;
    const { name, description } = validated.body;
    // التأكد أولاً من وجود العنصر قبل التحديث
    const existingWishLists = await db_1.db
        .select()
        .from(schema_1.wishList)
        .where((0, drizzle_orm_1.eq)(schema_1.wishList.id, id))
        .limit(1);
    if (!existingWishLists[0]) {
        throw new NotFound_1.NotFound("WishList not found");
    }
    // بناء كائن التحديث ديناميكياً لتجنب إرسال قيم undefined
    const updateData = {};
    if (name !== undefined)
        updateData.name = name;
    if (description !== undefined)
        updateData.description = description;
    await db_1.db.update(schema_1.wishList).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.wishList.id, id));
    (0, response_1.SuccessResponse)(res, { message: "WishList updated successfully" }, 200);
};
exports.updateWishLists = updateWishLists;
// ✅ Delete WishLists
const deleteWishLists = async (req, res) => {
    const validated = await exports.WishListIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const existingWishLists = await db_1.db
        .select()
        .from(schema_1.wishList)
        .where((0, drizzle_orm_1.eq)(schema_1.wishList.id, id))
        .limit(1);
    if (!existingWishLists[0]) {
        throw new NotFound_1.NotFound("WishList not found");
    }
    await db_1.db.delete(schema_1.wishList).where((0, drizzle_orm_1.eq)(schema_1.wishList.id, id));
    (0, response_1.SuccessResponse)(res, { message: "WishList deleted successfully" }, 200);
};
exports.deleteWishLists = deleteWishLists;
