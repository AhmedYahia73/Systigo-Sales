"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVisits = exports.updateVisits = exports.createVisits = exports.getVisitsById = exports.lists = exports.getAllVisits = exports.VisitIdSchema = exports.updateVisitSchema = exports.SalesVisitSchema = exports.createVisitSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../utils/response");
const NotFound_1 = require("../../Errors/NotFound");
const BadRequest_1 = require("../../Errors/BadRequest"); // تأكد من وجود هذا الـ Error Handler أو استبدله بما يتوافق مع مشروعك
const zod_1 = require("zod");
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
// الـ Schema الخاص بإنشاء Visit جديد
exports.createVisitSchema = zod_1.z.object({
    body: zod_1.z.object({
        lat: zod_1.z.number({ required_error: "Latitude (lat) is required" })
            .min(-90, "Latitude must be between -90 and 90")
            .max(90, "Latitude must be between -90 and 90"),
        lng: zod_1.z.number({ required_error: "Longitude (lng) is required" })
            .min(-180, "Longitude must be between -180 and 180")
            .max(180, "Longitude must be between -180 and 180"),
        name: zod_1.z.string({ required_error: "Name is required" })
            .min(1, "Name cannot be empty")
            .max(255, "Name cannot exceed 255 characters"),
        address: zod_1.z.string({ required_error: "Address is required" })
            .min(1, "Address cannot be empty")
            .max(500, "Address cannot exceed 500 characters"),
        notes: zod_1.z.string()
            .max(1000, "Notes cannot exceed 1000 characters")
            .nullable()
            .optional(),
        phone: zod_1.z.string({ required_error: "Phone is required" })
            .min(5, "Phone number is too short")
            .max(20, "Phone cannot exceed 20 characters"),
        status: zod_1.z.enum(["visit", "sales", "delivered"], {
            invalid_type_error: "Status must be either 'visit', 'sales', or 'delivered'",
        }).optional(),
        status_id: zod_1.z.string().nullable().optional(),
        sales_id: zod_1.z.string({ required_error: "Sales ID is required" }),
    }),
});
// الـ Schema الخاص بالتحقق من الـ sales_id عند جلب كل الزيارات التابعة له
exports.SalesVisitSchema = zod_1.z.object({
    body: zod_1.z.object({
        sales_id: zod_1.z.string({ required_error: "Sales ID is required" }).uuid("Invalid sales ID format"),
    }),
});
// الـ Schema الخاص بتحديث Visit
exports.updateVisitSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format"),
    }),
    body: zod_1.z.object({
        lat: zod_1.z.number().min(-90).max(90).optional(),
        lng: zod_1.z.number().min(-180).max(180).optional(),
        name: zod_1.z.string().min(1).max(255).optional(),
        address: zod_1.z.string().min(1).max(500).optional(),
        notes: zod_1.z.string().max(1000).nullable().optional(),
        phone: zod_1.z.string().min(5).max(20).optional(),
        status: zod_1.z.enum(["visit", "sales", "delivered"]).optional(),
        status_id: zod_1.z.string().nullable().optional(),
        sales_id: zod_1.z.string().nullable().optional(),
    }),
});
// الـ Schema الخاص بالعمليات التي تتطلب ID فقط
exports.VisitIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format"),
    }),
});
// ==========================================
// 🎮 Controllers
// ==========================================
// ✅ Get All Visits (Filtered by Sales ID)
const getAllVisits = async (req, res) => {
    // نقوم بجلب القيمة وإجبارها أن تكون string عن طريق الـ Type Casting
    const sales_id = req.query.sales_id;
    // التحقق من أن المستخدم أرسل الـ sales_id بالفعل وليست فارغة
    if (!sales_id) {
        throw new BadRequest_1.BadRequest("sales_id query parameter is required.");
    }
    // التحقق من أن الـ sales_id موجود بالفعل في قاعدة البيانات قبل جلب زياراته
    const salesExist = await db_1.db
        .select({ id: schema_1.users.id })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, sales_id))
        .limit(1);
    if (!salesExist[0]) {
        throw new BadRequest_1.BadRequest("The provided sales_id does not exist.");
    }
    const allVisitsRaw = await db_1.db
        .select({
        id: schema_1.visits.id,
        lat: schema_1.visits.lat,
        lng: schema_1.visits.lng,
        name: schema_1.visits.name,
        address: schema_1.visits.address,
        notes: schema_1.visits.notes,
        phone: schema_1.visits.phone,
        status: schema_1.visits.status,
        visit_status: schema_1.visitStatus.name,
        status_id: schema_1.visits.status_id,
        sales: schema_1.users.name,
        sales_phone: schema_1.users.phone,
    })
        .from(schema_1.visits)
        .where((0, drizzle_orm_1.eq)(schema_1.visits.sales_id, sales_id)) // لن يظهر الخطأ هنا الآن بعد الـ casting لـ string
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.visits.sales_id, schema_1.users.id))
        .leftJoin(schema_1.visitStatus, (0, drizzle_orm_1.eq)(schema_1.visits.status_id, schema_1.visitStatus.id));
    // إضافة رابط الخريطة تلقائياً لكل زيارة
    const allVisits = allVisitsRaw.map((visit) => ({
        ...visit,
        map_link: `https://www.google.com/maps/search/?api=1&query=${visit.lat},${visit.lng}`
    }));
    (0, response_1.SuccessResponse)(res, { allVisits }, 200);
};
exports.getAllVisits = getAllVisits;
// ✅ Get Active Visit Statuses
const lists = async (req, res) => {
    const visit_status = await db_1.db
        .select({
        id: schema_1.visitStatus.id,
        name: schema_1.visitStatus.name,
    })
        .from(schema_1.visitStatus)
        .where((0, drizzle_orm_1.eq)(schema_1.visitStatus.status, true));
    (0, response_1.SuccessResponse)(res, { visit_status }, 200);
};
exports.lists = lists;
// ✅ Get Visits By ID
const getVisitsById = async (req, res) => {
    const validated = await exports.VisitIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const visitRaw = await db_1.db
        .select({
        id: schema_1.visits.id,
        lat: schema_1.visits.lat,
        lng: schema_1.visits.lng,
        name: schema_1.visits.name,
        address: schema_1.visits.address,
        notes: schema_1.visits.notes,
        phone: schema_1.visits.phone,
        status: schema_1.visits.status,
        status_id: schema_1.visits.status_id,
        sales_id: schema_1.visits.sales_id,
    })
        .from(schema_1.visits)
        .where((0, drizzle_orm_1.eq)(schema_1.visits.id, id))
        .limit(1);
    if (!visitRaw[0]) {
        throw new NotFound_1.NotFound("Visit not found");
    }
    // إرفاق رابط الخريطة للزيارة المستهدفة
    const visit = {
        ...visitRaw[0],
        map_link: `https://www.google.com/maps/search/?api=1&query=${visitRaw[0].lat},${visitRaw[0].lng}`
    };
    (0, response_1.SuccessResponse)(res, { Visit: visit }, 200);
};
exports.getVisitsById = getVisitsById;
// ✅ Create Visits
const createVisits = async (req, res) => {
    const validated = await exports.createVisitSchema.parseAsync({ body: req.body });
    const { lat, lng, name, address, notes, phone, status, status_id, sales_id } = validated.body;
    // 🔍 التحقق من صحة وجود الـ sales_id في جدول المستخدمين (users)
    const salesExist = await db_1.db
        .select({ id: schema_1.users.id })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, sales_id))
        .limit(1);
    if (!salesExist[0]) {
        throw new BadRequest_1.BadRequest("The assigned sales_id does not exist.");
    }
    // 🔍 التحقق من صحة وجود الـ status_id في جدول الحالات (visitStatus) إن أُرسل
    if (status_id) {
        const statusExist = await db_1.db
            .select({ id: schema_1.visitStatus.id })
            .from(schema_1.visitStatus)
            .where((0, drizzle_orm_1.eq)(schema_1.visitStatus.id, status_id))
            .limit(1);
        if (!statusExist[0]) {
            throw new BadRequest_1.BadRequest("The assigned status_id does not exist.");
        }
    }
    await db_1.db.insert(schema_1.visits).values({
        lat,
        lng,
        name,
        address,
        notes: notes || null,
        phone,
        status: status || "visit",
        status_id: status_id || null,
        sales_id,
    });
    (0, response_1.SuccessResponse)(res, { message: "Visit created successfully" }, 201);
};
exports.createVisits = createVisits;
// ✅ Update Visits
const updateVisits = async (req, res) => {
    const validated = await exports.updateVisitSchema.parseAsync({
        params: req.params,
        body: req.body
    });
    const { id } = validated.params;
    const { lat, lng, name, address, notes, phone, status, status_id, sales_id } = validated.body;
    // 🔍 1. التأكد من وجود الزيارة الأصلية
    const existingVisits = await db_1.db
        .select()
        .from(schema_1.visits)
        .where((0, drizzle_orm_1.eq)(schema_1.visits.id, id))
        .limit(1);
    if (!existingVisits[0]) {
        throw new NotFound_1.NotFound("Visit not found");
    }
    // 🔍 2. إذا تم طلب تحديث الـ sales_id، نتأكد أنه مستخدم حقيقي وموجود
    if (sales_id !== undefined && sales_id !== null) {
        const salesExist = await db_1.db
            .select({ id: schema_1.users.id })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, sales_id))
            .limit(1);
        if (!salesExist[0]) {
            throw new BadRequest_1.BadRequest("The updated sales_id does not exist.");
        }
    }
    // 🔍 3. إذا تم طلب تحديث الـ status_id، نتأكد أنه حالة حقيقية وموجودة
    if (status_id !== undefined && status_id !== null) {
        const statusExist = await db_1.db
            .select({ id: schema_1.visitStatus.id })
            .from(schema_1.visitStatus)
            .where((0, drizzle_orm_1.eq)(schema_1.visitStatus.id, status_id))
            .limit(1);
        if (!statusExist[0]) {
            throw new BadRequest_1.BadRequest("The updated status_id does not exist.");
        }
    }
    // بناء كائن التحديث بشكل ديناميكي
    const updateData = {};
    if (lat !== undefined)
        updateData.lat = lat;
    if (lng !== undefined)
        updateData.lng = lng;
    if (name !== undefined)
        updateData.name = name;
    if (address !== undefined)
        updateData.address = address;
    if (notes !== undefined)
        updateData.notes = notes;
    if (phone !== undefined)
        updateData.phone = phone;
    if (status !== undefined)
        updateData.status = status;
    if (status_id !== undefined)
        updateData.status_id = status_id;
    if (sales_id !== undefined)
        updateData.sales_id = sales_id;
    await db_1.db.update(schema_1.visits).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.visits.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Visit updated successfully" }, 200);
};
exports.updateVisits = updateVisits;
// ✅ Delete Visits
const deleteVisits = async (req, res) => {
    const validated = await exports.VisitIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params;
    const existingVisits = await db_1.db
        .select()
        .from(schema_1.visits)
        .where((0, drizzle_orm_1.eq)(schema_1.visits.id, id))
        .limit(1);
    if (!existingVisits[0]) {
        throw new NotFound_1.NotFound("Visit not found");
    }
    await db_1.db.delete(schema_1.visits).where((0, drizzle_orm_1.eq)(schema_1.visits.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Visit deleted successfully" }, 200);
};
exports.deleteVisits = deleteVisits;
