// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { visitStatus, visits, target_sales, targets, target_items, users } from "../../models/schema";
import { BadRequest } from "../../Errors/BadRequest";
import { and, or, inArray, eq, gte, lte, gt, lt, count, sql, SQL } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound"; 
  
// ==========================================
// 🎮 Controllers
// ==========================================
export const viewDashboard = async (req: Request, res: Response) => { 
    const role = req.user?.role;
    const userId = req.user?.id;

    if (!userId) { 
        throw new BadRequest("User not authenticated.");
    }

    // 1. استخراج الفلترة بالتواريخ من query parameters
    const { from, to } = req.query as { from?: string; to?: string };

    // إعداد شروط التاريخ لجدول الزيارات (visits.createdAt)
    const visitDateConditions = [];
    if (from) {
        visitDateConditions.push(gte(visits.createdAt, new Date(from)));
    }
    if (to) {
        // نربط حتى نهاية اليوم المكون من التاريخ
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        visitDateConditions.push(lte(visits.createdAt, endDate));
    }

    // إعداد شروط التاريخ لجدول التارجت (target_items.year & target_items.month)
    const targetDateConditions = [];
    if (from) {
        const fromDate = new Date(from);
        const fromYear = fromDate.getFullYear();
        const fromMonth = fromDate.getMonth() + 1; // JavaScript months are 0-indexed

        targetDateConditions.push(
            or(
                gt(target_items.year, fromYear),
                and(eq(target_items.year, fromYear), gte(target_items.month, fromMonth))
            )
        );
    }
    if (to) {
        const toDate = new Date(to);
        const toYear = toDate.getFullYear();
        const toMonth = toDate.getMonth() + 1;

        targetDateConditions.push(
            or(
                lt(target_items.year, toYear),
                and(eq(target_items.year, toYear), lte(target_items.month, toMonth))
            )
        );
    }
    // 1. جلب معرفات المبيعات التابعين للقائد
    const salesList = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.leader_id, userId));

    // استخراج الـ IDs في مصفوفة بسيطة [1, 2, 3]
    const sales_ids = salesList.map((item) => item.id);

    // 2. بناء شروط الـ Join / Filtering
    const joinConditions = [eq(visits.status_id, visitStatus.id)];

    if (role === "sales") {
    joinConditions.push(eq(visits.sales_id, userId));
    } else if (role === "leader") {
        // استخدام inArray شرط أساسي إذا كانت القيمة Array
        if (sales_ids.length > 0) {
            joinConditions.push(inArray(visits.sales_id, sales_ids));
        } else {
            // في حالة عدم وجود مبيعات تابعين للقائد، يمكنك إضافة شرط يمنع جلب بيانات خاطئة
            joinConditions.push(sql`1 = 0`); 
        }
    }
    if (visitDateConditions.length > 0) {
        joinConditions.push(...visitDateConditions);
    }

    // 3. جلب الحالات النشطة وعد الزيارات المربوطة بكل حالة
    const allVisitStatuss = await db
        .select({
            id: visitStatus.id,
            name: visitStatus.name,
            count: count(visits.id),
        })
        .from(visitStatus)
        .leftJoin(visits, and(...joinConditions))
        .where(eq(visitStatus.status, true))
        .groupBy(visitStatus.id, visitStatus.name);

    // 4. إعداد شروط الاستعلام العام للزيارات
    const visitsWhereConditions = [];
    if (role === "sales") {
        visitsWhereConditions.push(eq(visits.sales_id, userId));
    } 
    else if (role === "leader") {
        // استخدام inArray شرط أساسي إذا كانت القيمة Array
        if (sales_ids.length > 0) {
            visitsWhereConditions.push(inArray(visits.sales_id, sales_ids));
        } else {
            // في حالة عدم وجود مبيعات تابعين للقائد، يمكنك إضافة شرط يمنع جلب بيانات خاطئة
            visitsWhereConditions.push(sql`1 = 0`); 
        }
    }
    if (visitDateConditions.length > 0) {
        visitsWhereConditions.push(...visitDateConditions);
    }

    const [countsResult] = await db
        .select({
            negotiation: sql<number>`CAST(COALESCE(COUNT(CASE WHEN ${visits.status} = 'visit' THEN 1 END), 0) AS UNSIGNED)`,
            sales: sql<number>`CAST(COALESCE(COUNT(CASE WHEN ${visits.status} = 'sales' THEN 1 END), 0) AS UNSIGNED)`,
            delivered: sql<number>`CAST(COALESCE(COUNT(CASE WHEN ${visits.status} = 'delivered' THEN 1 END), 0) AS UNSIGNED)`
        })
        .from(visits)
        .where(visitsWhereConditions.length > 0 ? and(...visitsWhereConditions) : undefined);

    const negotiation = Number(countsResult?.negotiation || 0);
    const sales = Number(countsResult?.sales || 0);
    const delivered = Number(countsResult?.delivered || 0);

    const targetAchievedSales = sales + delivered;
    const targetAchievedVisits = negotiation;

    // 5. حساب التارجت المخصص بناءً على المستخدم والتواريخ
 // 5. حساب التارجت المخصص بناءً على المستخدم والتواريخ
    const targetWhereConditions: SQL[] = [eq(target_sales.user_id, userId)];
    
    if (targetDateConditions.length > 0) {
        targetWhereConditions.push(...(targetDateConditions.filter(Boolean) as SQL[]));
    }

    const [salesTargetResult] = await db
        .select({
            total_visits_target: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${targets.type} = 'visit' THEN ${target_items.number} END), 0) AS UNSIGNED) AS total_visits_target`,
            total_sales_target: sql<number>`CAST(COALESCE(SUM(CASE WHEN ${targets.type} = 'sales' THEN ${target_items.number} END), 0) AS UNSIGNED) AS total_sales_target`,
        })
        .from(target_sales)
        .leftJoin(targets, eq(target_sales.target_id, targets.id))
        .leftJoin(target_items, eq(target_items.target_id, targets.id))
        .where(and(...targetWhereConditions));

    const total_visits_target = Number(salesTargetResult?.total_visits_target || 0);
    const total_sales_target = Number(salesTargetResult?.total_sales_target || 0);

    // 6. إرسال الاستجابة النظيفة
    SuccessResponse(res, { 
        allVisitStatuss, 
        negotiation, 
        sales, 
        delivered,
        targetAchievedSales,
        targetAchievedVisits,
        total_visits_target,
        total_sales_target,
    }, 200);
};