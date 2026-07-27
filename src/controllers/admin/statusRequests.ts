// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { statusRequest, visits, users } from "../../models/schema"; 
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { z } from "zod"; 
import { eq, desc, or, ilike, count, and, ne } from 'drizzle-orm';

// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

export const requestIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format"),
  }),
  body: z.object({ 
    status: z.enum(["approve", "reject"], {
      required_error: "Action status is required",
      invalid_type_error: "Status must be either 'approve' or 'reject'",
    }),
  }),
});

// ==========================================
// 🎮 Controllers
// ==========================================

// ✅ Get Pending Requests
export const getPendingRequest = async (req: Request, res: Response) => {
    // 1. استخراج معاملات البحث والصفحات من الـ query
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string || '').trim();

    const offset = (page - 1) * limit;

    // 2. الشروط
    const baseCondition = eq(statusRequest.status, 'pending');

    const leaderCondition = req.user?.role === "leader" 
        ? eq(users.leader_id, req.user?.id) 
        : undefined;

    const searchCondition = search
        ? or(
            ilike(users.name, `%${search}%`),
            ilike(users.phone, `%${search}%`),
            ilike(visits.name, `%${search}%`)
          )
        : undefined;

    // دمج الشروط تلقائياً (تتجاهل Drizzle القيم الـ undefined)
    const whereClause = and(baseCondition, leaderCondition, searchCondition);

    // 3. استعلام جلب البيانات
    const pendingRequests = await db
        .select({
            id: statusRequest.id,
            user_name: users.name,
            user_phone: users.phone,
            visit_name: visits.name,
            from: statusRequest.from,
            to: statusRequest.to,
            status: statusRequest.status,
            createdAt: statusRequest.createdAt,
        })
        .from(statusRequest)
        .leftJoin(users, eq(statusRequest.userId, users.id))
        .leftJoin(visits, eq(statusRequest.visitId, visits.id))
        .where(whereClause)
        .orderBy(desc(statusRequest.createdAt))
        .limit(limit)
        .offset(offset);

    // 4. استعلام حساب الإجمالي
    const [{ total }] = await db
        .select({ total: count() })
        .from(statusRequest)
        .leftJoin(users, eq(statusRequest.userId, users.id))
        .leftJoin(visits, eq(statusRequest.visitId, visits.id))
        .where(whereClause);

    const totalPages = Math.ceil(total / limit);

    // 5. إرسال الاستجابة
    SuccessResponse(res, {
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

// ✅ Get History Requests
export const getHistoryRequest = async (req: Request, res: Response) => {
    // 1. استخراج معاملات البحث والصفحات من الـ query
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string || '').trim();

    const offset = (page - 1) * limit;

    // 2. الشروط (أي حالة غير الـ pending)
    const baseCondition = ne(statusRequest.status, 'pending');

    const leaderCondition = req.user?.role === "leader" 
        ? eq(users.leader_id, req.user?.id) 
        : undefined;

    const searchCondition = search
        ? or(
            ilike(users.name, `%${search}%`),
            ilike(users.phone, `%${search}%`),
            ilike(visits.name, `%${search}%`)
          )
        : undefined;

    const whereClause = and(baseCondition, leaderCondition, searchCondition);

    // 3. استعلام جلب البيانات التاريخية
    const historyRequests = await db
        .select({
            id: statusRequest.id,
            user_name: users.name,
            user_phone: users.phone,
            visit_name: visits.name,
            from: statusRequest.from,
            to: statusRequest.to,
            status: statusRequest.status,
            createdAt: statusRequest.createdAt,
        })
        .from(statusRequest)
        .leftJoin(users, eq(statusRequest.userId, users.id))
        .leftJoin(visits, eq(statusRequest.visitId, visits.id))
        .where(whereClause)
        .orderBy(desc(statusRequest.createdAt))
        .limit(limit)
        .offset(offset);

    // 4. استعلام حساب الإجمالي
    const [{ total }] = await db
        .select({ total: count() })
        .from(statusRequest)
        .leftJoin(users, eq(statusRequest.userId, users.id))
        .leftJoin(visits, eq(statusRequest.visitId, visits.id))
        .where(whereClause);

    const totalPages = Math.ceil(total / limit);

    // 5. إرسال الاستجابة
    SuccessResponse(res, {
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

// ✅ Change Request Status
export const changeStatus = async (req: Request, res: Response) => {
    const validated = await requestIdSchema.parseAsync({ params: req.params, body: req.body });
    const id = validated.params.id;
    const status = validated.body.status; // القيمة إما 'approve' أو 'reject'

    const existRequest = await db.select({
        id: statusRequest.id,
        from: statusRequest.from,
        to: statusRequest.to,
        visitId: statusRequest.visitId,
    })
    .from(statusRequest)
    .where(eq(statusRequest.id, id))
    .limit(1);
    if (!existRequest.length) {
        throw new NotFound("Request not found");
    }

    await db.update(statusRequest)
        .set({ status })
        .where(eq(statusRequest.id, id));
    if(status === "approve") { 
        await db.update(visits)
        .set({status : existRequest[0].to})
        .where(eq(visits.id, existRequest[0].visitId));
    }

    SuccessResponse(res, { message: "Status updated successfully" }, 200);
};