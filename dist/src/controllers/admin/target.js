"use strict";
// src/controllers/Sales/SalesController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTargets = exports.updateTargets = exports.createTargets = exports.getTargetsById = exports.getAllTargets = exports.getAllTargetsSchema = exports.targetIdSchema = exports.updateTargetSchema = exports.createTargetSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const zod_1 = require("zod");
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
// الـ Schema الخاص بإنشاء target جديد
exports.createTargetSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(["visit", "sales"], {
            required_error: "Type is required",
            invalid_type_error: "Type must be either 'visit' or 'sales'",
        }).default("visit"),
        name: zod_1.z.string({
            required_error: "Name is required",
        })
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters"),
        number: zod_1.z.number({
            required_error: "Number is required",
            invalid_type_error: "Number must be a valid numeric value",
        }),
    }),
});
// الـ Schema الخاص بتحديث target (البيانات اختيارية ولكن إذا أرسلت يجب أن تطابق الأنواع)
exports.updateTargetSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }), // غيرها لـ z.coerce.number() لو الـ ID رقم في قاعدة البيانات
    }),
    body: zod_1.z.object({
        type: zod_1.z.enum(["visit", "sales"], {
            invalid_type_error: "Type must be either 'visit' or 'sales'",
        }).optional(),
        name: zod_1.z.string().min(1, "Name cannot be empty").max(255).optional(),
        number: zod_1.z.number({ invalid_type_error: "Number must be a numeric value" }).optional(),
    }),
});
// الـ Schema الخاص بالعمليات التي تتطلب ID فقط أو الـ query params
exports.targetIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }), // غيرها لـ z.coerce.number() لو الـ ID رقم في قاعدة البيانات
    }),
});
// التحقق من الـ Route Params عند جلب الكل بنوع محدد (اختياري)
exports.getAllTargetsSchema = zod_1.z.object({
    params: zod_1.z.object({
        type: zod_1.z.enum(["visit", "sales"]).optional(),
    }),
});
// ==========================================
// 🎮 Controllers
// ==========================================
// ✅ Get All Targets
const getAllTargets = async (req, res) => {
    // التحقق من الـ params إن وُجدت
    const validated = await exports.getAllTargetsSchema.parseAsync({ params: req.params });
    const { type } = validated.params;
    // 1. بناء الاستعلام الأساسي
    let query = db_1.db
        .select({
        id: schema_1.targets.id,
        type: schema_1.targets.type,
        name: schema_1.targets.name,
        number: schema_1.targets.number,
    })
        .from(schema_1.targets);
    // 2. تصفية النتائج بناءً على النوع لو تم إرساله
    if (type) {
        query = query.where((0, drizzle_orm_1.eq)(schema_1.targets.type, type));
    }
    // 3. تنفيذ الاستعلام
    const alltargets = await query;
    // 4. إرسال الرد
    (0, response_1.SuccessResponse)(res, { sales: alltargets }, 200);
};
exports.getAllTargets = getAllTargets;
// ✅ Get Targets By ID
const getTargetsById = async (req, res) => {
    const validated = await exports.targetIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const Targets = await db_1.db
        .select({
        id: schema_1.targets.id,
        type: schema_1.targets.type,
        name: schema_1.targets.name,
        number: schema_1.targets.number,
    })
        .from(schema_1.targets)
        .where((0, drizzle_orm_1.eq)(schema_1.targets.id, id))
        .limit(1);
    if (!Targets[0]) {
        throw new NotFound_1.NotFound("Targets not found");
    }
    (0, response_1.SuccessResponse)(res, { Targets: Targets[0] }, 200);
};
exports.getTargetsById = getTargetsById;
// ✅ Create Targets
const createTargets = async (req, res) => {
    const validated = await exports.createTargetSchema.parseAsync({ body: req.body });
    const { type, name, number } = validated.body;
    await db_1.db.insert(schema_1.targets).values({
        type,
        name,
        number: number, // لو حقل الداتابيز double كـ string أو اتركها number حسب الـ schema عندك
    });
    (0, response_1.SuccessResponse)(res, { message: "Targets created successfully" }, 201);
};
exports.createTargets = createTargets;
// ✅ Update Targets
const updateTargets = async (req, res) => {
    const validated = await exports.updateTargetSchema.parseAsync({
        params: req.params,
        body: req.body
    });
    const { id } = validated.params;
    const { type, name, number } = validated.body;
    // التأكد أولاً من وجود العنصر قبل التحديث
    const existingTargets = await db_1.db
        .select()
        .from(schema_1.targets)
        .where((0, drizzle_orm_1.eq)(schema_1.targets.id, id))
        .limit(1);
    if (!existingTargets[0]) {
        throw new NotFound_1.NotFound("Targets not found");
    }
    // بناء كائن التحديث ديناميكياً لتجنب إرسال قيم undefined
    const updateData = {};
    if (type !== undefined)
        updateData.type = type;
    if (name !== undefined)
        updateData.name = name;
    if (number !== undefined)
        updateData.number = Number(number);
    if (updateData) {
        await db_1.db.update(schema_1.targets).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.targets.id, id));
    }
    (0, response_1.SuccessResponse)(res, { message: "Targets updated successfully" }, 200);
};
exports.updateTargets = updateTargets;
// ✅ Delete Targets
const deleteTargets = async (req, res) => {
    const validated = await exports.targetIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const existingTargets = await db_1.db
        .select()
        .from(schema_1.targets)
        .where((0, drizzle_orm_1.eq)(schema_1.targets.id, id))
        .limit(1);
    if (!existingTargets[0]) {
        throw new NotFound_1.NotFound("Targets not found");
    }
    await db_1.db.delete(schema_1.targets).where((0, drizzle_orm_1.eq)(schema_1.targets.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Targets deleted successfully" }, 200);
};
exports.deleteTargets = deleteTargets;
