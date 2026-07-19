import { Request, Response } from "express";
import { db } from "../../models/db";
import { users, visits, visitStatus } from "../../models/schema"; 
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import { z } from "zod";
import { SQL, and, or, eq, ilike, inArray, count, gte, lte, desc } from 'drizzle-orm';
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

export const createVisitSchema = (userRole?: string) => {
    return z.object({
        body: z.object({ 
            lat: z.number({ required_error: "Latitude (lat) is required" })
                .min(-90, "Latitude must be between -90 and 90")
                .max(90, "Latitude must be between -90 and 90"),
            
            lng: z.number({ required_error: "Longitude (lng) is required" })
                .min(-180, "Longitude must be between -180 and 180")
                .max(180, "Longitude must be between -180 and 180"),
            
            name: z.string({ required_error: "Name is required" })
                .min(1, "Name cannot be empty")
                .max(255, "Name cannot exceed 255 characters"),
            
            address: z.string({ required_error: "Address is required" })
                .min(1, "Address cannot be empty")
                .max(500, "Address cannot exceed 500 characters"),
            
            notes: z.string()
                .max(1000, "Notes cannot exceed 1000 characters")
                .nullable()
                .optional(),
            
            phone: z.string({ required_error: "Phone is required" })
                .min(5, "Phone number is too short")
                .max(20, "Phone cannot exceed 20 characters"),
            
            status: z.enum(["visit", "sales", "delivered"], {
                invalid_type_error: "Status must be either 'visit', 'sales', or 'delivered'",
            }).optional(),

            status_id: z.string().nullable().optional(),
            sales_id: userRole === "sales" || userRole === "leader"
                ? z.string().uuid().optional()
                : z.string({ required_error: "Sales ID is required" }),
        }),
    }); 
};

export const updateVisitSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "ID is required in parameters" }),
    }),
    body: z.object({ 
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
        name: z.string().min(1).max(255).optional(),
        address: z.string().min(1).max(500).optional(),
        notes: z.string().max(1000).nullable().optional(),
        phone: z.string().min(5).max(20).optional(),
        status: z.enum(["visit", "sales", "delivered"]).optional(),
        status_id: z.string().nullable().optional(),
        sales_id: z.string().nullable().optional(),
    }),
});

export const VisitIdSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "ID is required in parameters" }),
    }),
}); 


// ==========================================
// 🎮 Controllers
// ==========================================

// ✅ Get All Visitsexport 
export const getAllVisits = async (req: Request, res: Response) => {  
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const querySalesId = req.query.sales_id as string;

    // استقبال معايير الـ Pagination والبحث
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    
    // استقبال معايير فلترة التاريخ (صيغة المتوقع: YYYY-MM-DD)
    const fromDateStr = req.query.from as string; // مثلاً: 2026-05-05
    const toDateStr = req.query.to as string;     // مثلاً: 2026-05-05

    const offset = (page - 1) * limit;

    let whereConditions: SQL[] = [];

    // 1. تطبيق الصلاحيات والفلترة الذكية لـ Drizzle
    if (userRole === "admin") {
        if (querySalesId) {
            whereConditions.push(eq(visits.sales_id, querySalesId));
        }
    } else if (userRole === "leader") {
        const teamSales = await db
            .select({ id: users.id })
            .from(users)
            .where(
                or(
                    and(eq(users.leader_id, userId!), eq(users.role, "sales")), 
                    eq(users.id, userId!)
                )
            );
        
        const salesIds = teamSales.map(s => s.id);

        if (querySalesId) {
            if (salesIds.includes(querySalesId)) {
                whereConditions.push(eq(visits.sales_id, querySalesId));
            } else {
                throw new BadRequest("You do not have access to this sales member's visits.");
            }
        } else {
            if (salesIds.length > 0) {
                whereConditions.push(inArray(visits.sales_id, salesIds));
            } else {
                return SuccessResponse(res, { allVisits: [], pagination: { total: 0, page, limit, totalPages: 0 } }, 200);
            }
        }
    } else if (userRole === "sales") {
        whereConditions.push(eq(visits.sales_id, userId!));
    } else {
        throw new BadRequest("Unauthorized role");
    }

    // 2. تطبيق البحث (Search) بناءً على الاسم، الإيميل، أو الهاتف
    if (search) {
        const searchPattern = `%${search}%`;
        whereConditions.push(
            or(
                ilike(visits.name, searchPattern),         // اسم العميل/الزيارة
                ilike(visits.phone, searchPattern),        // هاتف العميل/الزيارة
                ilike(users.name, searchPattern),          // اسم المندوب
                ilike(users.email, searchPattern),         // إيميل المندوب
                ilike(users.phone, searchPattern)          // هاتف المندوب
            ) as SQL
        );
    }

    // 3. تطبيق الفلترة بالتاريخ بدون وقت (Date-only filter)
    // نستخدم الكائنات الافتراضية للوقت للتأكد من جلب اليوم كاملاً (من 00:00:00 إلى 23:59:59)
    if (fromDateStr) {
        const fromDate = new Date(`${fromDateStr}T00:00:00.000Z`);
        if (!isNaN(fromDate.getTime())) {
            whereConditions.push(gte(visits.createdAt, fromDate));
        }
    }

    if (toDateStr) {
        const toDate = new Date(`${toDateStr}T23:59:59.999Z`);
        if (!isNaN(toDate.getTime())) {
            whereConditions.push(lte(visits.createdAt, toDate));
        }
    }

    // 4. بناء الاستعلام الأساسي (Base Query)
    let baseQuery = db
        .select({
            id: visits.id, 
            lat: visits.lat,
            lng: visits.lng,
            name: visits.name,
            address: visits.address,
            notes: visits.notes,
            phone: visits.phone,
            status: visits.status,
            visit_status: visitStatus.name,
            status_id: visits.status_id,
            sales: users.name,
            sales_phone: users.phone,
            createdAt: visits.createdAt
        })
        .from(visits)
        .leftJoin(users, eq(visits.sales_id, users.id))
        .leftJoin(visitStatus, eq(visits.status_id, visitStatus.id))
        .orderBy(desc(visits.createdAt))
        .$dynamic();

    // 5. استعلام لحساب العدد الإجمالي متوافق مع الفلاتر (Count Query)
    let countQuery = db
        .select({ total: count() })
        .from(visits)
        .leftJoin(users, eq(visits.sales_id, users.id))
        .leftJoin(visitStatus, eq(visits.status_id, visitStatus.id))
        .$dynamic();

    // ربط الشروط بالاستعلامات
    if (whereConditions.length > 0) {
        baseQuery = baseQuery.where(and(...whereConditions));
        countQuery = countQuery.where(and(...whereConditions));
    }

    // تنفيذ الاستعلامين معاً بالتوازي لتحسين الأداء
    const [allVisitsRaw, [{ total: totalCount }]] = await Promise.all([
        baseQuery.limit(limit).offset(offset),
        countQuery
    ]);

    // إضافة رابط الخريطة تلقائياً لكل زيارة
    const allVisits = allVisitsRaw.map((visit) => ({
        ...visit,
        map_link: `https://www.google.com/maps/search/?api=1&query=${visit.lat},${visit.lng}`
    }));

    // إرسال النتيجة مع معلومات الـ pagination الكاملة
    SuccessResponse(res, { 
        allVisits,
        pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    }, 200);
};

// ✅ Get Active Visit Statuses
export const lists = async (req: Request, res: Response) => { 
    const visit_status = await db
        .select({
            id: visitStatus.id,  
            name: visitStatus.name,  
        })
        .from(visitStatus)
        .where(eq(visitStatus.status, true));  
 
    SuccessResponse(res, { visit_status }, 200);
}; 

// ✅ Get Visits By ID
export const getVisitsById = async (req: Request, res: Response) => {
    const validated = await VisitIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const visitRaw = await db
        .select({
            id: visits.id, 
            lat: visits.lat,
            lng: visits.lng,
            name: visits.name, 
            address: visits.address,
            notes: visits.notes,
            phone: visits.phone,
            status: visits.status,
            status_id: visits.status_id,
            sales_id: visits.sales_id,
        })
        .from(visits) 
        .where(eq(visits.id, id))
        .limit(1);

    if (!visitRaw[0]) {
        throw new NotFound("Visit not found");
    }

    // التحقق من الصلاحيات للوصول لزيارة معينة
    if (req.user?.role === "sales" && visitRaw[0].sales_id !== req.user.id) {
        throw new BadRequest("You do not have permission to access this visit.");
    }

    const visit = {
        ...visitRaw[0],
        map_link: `https://www.google.com/maps/search/?api=1&query=${visitRaw[0].lat},${visitRaw[0].lng}`
    };

    SuccessResponse(res, { Visit: visit }, 200);
};

// ✅ Create Visits
export const createVisits = async (req: Request, res: Response) => {
    const validated = await createVisitSchema(req.user?.role).parseAsync({ body: req.body });
    const { lat, lng, name, address, notes, phone, status, status_id } = validated.body;
    
    let sales_id = "";
    if (req.user?.role === "leader" || req.user?.role === "sales") {
        sales_id = req.user?.id!;
    } else {
        sales_id = validated.body.sales_id!;
    }

    // 🔍 التحقق من صحة وجود الـ sales_id في جدول المستخدمين
    const salesExist = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, sales_id), 
        or(eq(users.role, "sales"), eq(users.role, "leader"))))
        .limit(1);

    if (!salesExist[0]) {
        throw new BadRequest("The assigned sales_id does not exist or user is not a sales member.");
    }

    // 🔍 التحقق من صحة وجود الـ status_id في جدول الحالات إن أُرسل
    if (status_id) {
        const statusExist = await db
            .select({ id: visitStatus.id })
            .from(visitStatus)
            .where(and(eq(visitStatus.id, status_id), eq(visitStatus.status, true)))
            .limit(1);

        if (!statusExist[0]) {
            throw new BadRequest("The assigned status_id does not exist or is inactive.");
        }
    }

    await db.insert(visits).values({ 
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

    SuccessResponse(res, { message: "Visit created successfully" }, 201);
};

// ✅ Update Visits
export const updateVisits = async (req: Request, res: Response) => {
    const validated = await updateVisitSchema.parseAsync({ 
        params: req.params, 
        body: req.body 
    });
    const { id } = validated.params;
    const { lat, lng, name, address, notes, phone, status, status_id } = validated.body;
  
    // 🔍 1. التأكد من وجود الزيارة الأصلية
    const existingVisit = await db
        .select()
        .from(visits)
        .where(eq(visits.id, id))
        .limit(1);

    if (!existingVisit[0]) {
        throw new NotFound("Visit not found");
    }

    // تحديد الـ sales_id للتحقق منه أو إدخاله
    let sales_id = req.body.sales_id;
    if (req.user?.role === "leader" || req.user?.role === "sales") {
        sales_id = req.user?.id!;
        
        // منع الـ Sales من تعديل زيارة لا تخصه
        if (existingVisit[0].sales_id !== sales_id) {
            throw new BadRequest("You do not have permission to modify this visit.");
        }
    }

    // 🔍 2. التحقق من وجود الـ sales_id الجديد إذا تم تعديله
    if (sales_id !== undefined && sales_id !== null) {
        const salesExist = await db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.id, sales_id), 
            or(eq(users.role, "sales"), eq(users.role, "leader"))))
            .limit(1);

        if (!salesExist[0]) {
            throw new BadRequest("The updated sales_id does not exist.");
        }
    }

    // 🔍 3. التحقق من وجود الـ status_id الجديد إذا تم تعديله
    if (status_id !== undefined && status_id !== null) {
        const statusExist = await db
            .select({ id: visitStatus.id })
            .from(visitStatus)
            .where(and(eq(visitStatus.id, status_id), eq(visitStatus.status, true)))
            .limit(1);

        if (!statusExist[0]) {
            throw new BadRequest("The updated status_id does not exist.");
        }
    }

    // بناء كائن التحديث بشكل ديناميكي
    const updateData: any = {};
    if (lat !== undefined) updateData.lat = lat;
    if (lng !== undefined) updateData.lng = lng;
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;
    if (status_id !== undefined) updateData.status_id = status_id;
    if (sales_id !== undefined) updateData.sales_id = sales_id;

    // دمج الشروط في كائن استعلام واحد بشكل صحيح وسليم
    let updateConditions = eq(visits.id, id);
    if (req.user?.role === "leader" || req.user?.role === "sales") {
        updateConditions = and(eq(visits.id, id), eq(visits.sales_id, req.user.id)) as any;
    }

    await db.update(visits).set(updateData).where(updateConditions);
    
    SuccessResponse(res, { message: "Visit updated successfully" }, 200);
};

// ✅ Delete Visits
export const deleteVisits = async (req: Request, res: Response) => {
    const validated = await VisitIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 
  
    const existingVisit = await db
        .select()
        .from(visits)
        .where(eq(visits.id, id))
        .limit(1);

    if (!existingVisit[0]) {
        throw new NotFound("Visit not found");
    }

    // بناء شروط الحذف الآمن في استعلام موحد لمنع تكرار دالة .where() الخاطئ
    let deleteConditions = eq(visits.id, id);
    if (req.user?.role === "leader" || req.user?.role === "sales") {
        deleteConditions = and(eq(visits.id, id), eq(visits.sales_id, req.user.id)) as any;
    }

    const deleteResult = await db.delete(visits).where(deleteConditions);

    SuccessResponse(res, { message: "Visit deleted successfully" }, 200);
};