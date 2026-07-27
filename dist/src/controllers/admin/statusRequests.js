"use strict";
// src/controllers/Sales/SalesController.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeStatus = exports.getHistoryRequest = exports.getPendingRequest = exports.requestIdSchema = void 0;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const response_1 = require("../../utils/response");
const zod_1 = require("zod");
const drizzle_orm_1 = require("drizzle-orm");
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================
exports.requestIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format"),
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(["approve", "reject"], {
            required_error: "Action status is required",
            invalid_type_error: "Status must be either 'approve' or 'reject'",
        }),
    }),
});
// ==========================================
// 🎮 Controllers
// ==========================================
// ✅ Get Pending Requests
const getPendingRequest = async (req, res) => {
    // 1. استخراج معاملات البحث والصفحات من الـ query
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;
    // 2. الشروط
    const baseCondition = (0, drizzle_orm_1.eq)(schema_1.statusRequest.status, 'pending');
    const leaderCondition = req.user?.role === "leader"
        ? (0, drizzle_orm_1.eq)(schema_1.users.leader_id, req.user?.id)
        : undefined;
    const searchCondition = search
        ? (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.users.name, `%${search}%`), (0, drizzle_orm_1.ilike)(schema_1.users.phone, `%${search}%`), (0, drizzle_orm_1.ilike)(schema_1.visits.name, `%${search}%`))
        : undefined;
    // دمج الشروط تلقائياً (تتجاهل Drizzle القيم الـ undefined)
    const whereClause = (0, drizzle_orm_1.and)(baseCondition, leaderCondition, searchCondition);
    // 3. استعلام جلب البيانات
    const pendingRequests = await db_1.db
        .select({
        id: schema_1.statusRequest.id,
        user_name: schema_1.users.name,
        user_phone: schema_1.users.phone,
        visit_name: schema_1.visits.name,
        from: schema_1.statusRequest.from,
        to: schema_1.statusRequest.to,
        status: schema_1.statusRequest.status,
        createdAt: schema_1.statusRequest.createdAt,
    })
        .from(schema_1.statusRequest)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.statusRequest.userId, schema_1.users.id))
        .leftJoin(schema_1.visits, (0, drizzle_orm_1.eq)(schema_1.statusRequest.visitId, schema_1.visits.id))
        .where(whereClause)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.statusRequest.createdAt))
        .limit(limit)
        .offset(offset);
    // 4. استعلام حساب الإجمالي
    const [{ total }] = await db_1.db
        .select({ total: (0, drizzle_orm_1.count)() })
        .from(schema_1.statusRequest)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.statusRequest.userId, schema_1.users.id))
        .leftJoin(schema_1.visits, (0, drizzle_orm_1.eq)(schema_1.statusRequest.visitId, schema_1.visits.id))
        .where(whereClause);
    const totalPages = Math.ceil(total / limit);
    // 5. إرسال الاستجابة
    (0, response_1.SuccessResponse)(res, {
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
exports.getPendingRequest = getPendingRequest;
// ✅ Get History Requests
const getHistoryRequest = async (req, res) => {
    // 1. استخراج معاملات البحث والصفحات من الـ query
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const search = (req.query.search || '').trim();
    const offset = (page - 1) * limit;
    // 2. الشروط (أي حالة غير الـ pending)
    const baseCondition = (0, drizzle_orm_1.ne)(schema_1.statusRequest.status, 'pending');
    const leaderCondition = req.user?.role === "leader"
        ? (0, drizzle_orm_1.eq)(schema_1.users.leader_id, req.user?.id)
        : undefined;
    const searchCondition = search
        ? (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.users.name, `%${search}%`), (0, drizzle_orm_1.ilike)(schema_1.users.phone, `%${search}%`), (0, drizzle_orm_1.ilike)(schema_1.visits.name, `%${search}%`))
        : undefined;
    const whereClause = (0, drizzle_orm_1.and)(baseCondition, leaderCondition, searchCondition);
    // 3. استعلام جلب البيانات التاريخية
    const historyRequests = await db_1.db
        .select({
        id: schema_1.statusRequest.id,
        user_name: schema_1.users.name,
        user_phone: schema_1.users.phone,
        visit_name: schema_1.visits.name,
        from: schema_1.statusRequest.from,
        to: schema_1.statusRequest.to,
        status: schema_1.statusRequest.status,
        createdAt: schema_1.statusRequest.createdAt,
    })
        .from(schema_1.statusRequest)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.statusRequest.userId, schema_1.users.id))
        .leftJoin(schema_1.visits, (0, drizzle_orm_1.eq)(schema_1.statusRequest.visitId, schema_1.visits.id))
        .where(whereClause)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.statusRequest.createdAt))
        .limit(limit)
        .offset(offset);
    // 4. استعلام حساب الإجمالي
    const [{ total }] = await db_1.db
        .select({ total: (0, drizzle_orm_1.count)() })
        .from(schema_1.statusRequest)
        .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.statusRequest.userId, schema_1.users.id))
        .leftJoin(schema_1.visits, (0, drizzle_orm_1.eq)(schema_1.statusRequest.visitId, schema_1.visits.id))
        .where(whereClause);
    const totalPages = Math.ceil(total / limit);
    // 5. إرسال الاستجابة
    (0, response_1.SuccessResponse)(res, {
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
exports.getHistoryRequest = getHistoryRequest;
// ✅ Change Request Status
const changeStatus = async (req, res) => {
    const validated = await exports.requestIdSchema.parseAsync({ params: req.params, body: req.body });
    const id = validated.params.id;
    const status = validated.body.status; // القيمة إما 'approve' أو 'reject'
    await db_1.db.update(schema_1.statusRequest)
        .set({ status })
        .where((0, drizzle_orm_1.eq)(schema_1.statusRequest.id, id));
    (0, response_1.SuccessResponse)(res, { message: "Status updated successfully" }, 200);
};
exports.changeStatus = changeStatus;
