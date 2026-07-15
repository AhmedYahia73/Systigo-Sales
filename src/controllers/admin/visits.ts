import { Request, Response } from "express";
import { db } from "../../models/db";
import { users, visits, visitStatus } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest"; // تأكد من وجود هذا الـ Error Handler أو استبدله بما يتوافق مع مشروعك
import { z } from "zod";

// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

// الـ Schema الخاص بإنشاء Visit جديد
export const createVisitSchema = z.object({
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

    status_id: z.string().uuid("Invalid status ID format").nullable().optional(),
    sales_id: z.string({ required_error: "Sales ID is required" }).uuid("Invalid sales ID format"),
  }),
});

// الـ Schema الخاص بالتحقق من الـ sales_id عند جلب كل الزيارات التابعة له
export const SalesVisitSchema = z.object({
  body: z.object({ 
    sales_id: z.string({ required_error: "Sales ID is required" }).uuid("Invalid sales ID format"),
  }),
});

// الـ Schema الخاص بتحديث Visit
export const updateVisitSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format"),
  }),
  body: z.object({ 
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    name: z.string().min(1).max(255).optional(),
    address: z.string().min(1).max(500).optional(),
    notes: z.string().max(1000).nullable().optional(),
    phone: z.string().min(5).max(20).optional(),
    status: z.enum(["visit", "sales", "delivered"]).optional(),
    status_id: z.string().uuid("Invalid status ID format").nullable().optional(),
    sales_id: z.string().uuid("Invalid sales ID format").nullable().optional(),
  }),
});

// الـ Schema الخاص بالعمليات التي تتطلب ID فقط
export const VisitIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format"),
  }),
}); 


// ==========================================
// 🎮 Controllers
// ==========================================

// ✅ Get All Visits (Filtered by Sales ID)
export const getAllVisits = async (req: Request, res: Response) => { 
    const validated = await SalesVisitSchema.parseAsync({ body: req.body });
    const { sales_id } = validated.body;

    // التحقق من أن الـ sales_id موجود بالفعل في قاعدة البيانات قبل جلب زياراته
    const salesExist = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, sales_id))
        .limit(1);

    if (!salesExist[0]) {
        throw new BadRequest("The provided sales_id does not exist.");
    }

    const allVisitsRaw = await db
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
        })
        .from(visits)
        .where(eq(visits.sales_id, sales_id))
        .leftJoin(users, eq(visits.sales_id, users.id))
        .leftJoin(visitStatus, eq(visits.status_id, visitStatus.id)); 

    // إضافة رابط الخريطة تلقائياً لكل زيارة
    const allVisits = allVisitsRaw.map((visit) => ({
        ...visit,
        map_link: `https://www.google.com/maps/search/?api=1&query=${visit.lat},${visit.lng}`
    }));
 
    SuccessResponse(res, { allVisits }, 200);
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

    // إرفاق رابط الخريطة للزيارة المستهدفة
    const visit = {
        ...visitRaw[0],
        map_link: `https://www.google.com/maps/search/?api=1&query=${visitRaw[0].lat},${visitRaw[0].lng}`
    };

    SuccessResponse(res, { Visit: visit }, 200);
};

// ✅ Create Visits
export const createVisits = async (req: Request, res: Response) => {
    const validated = await createVisitSchema.parseAsync({ body: req.body });
    const { lat, lng, name, address, notes, phone, status, status_id, sales_id } = validated.body;
    
    // 🔍 التحقق من صحة وجود الـ sales_id في جدول المستخدمين (users)
    const salesExist = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, sales_id))
        .limit(1);

    if (!salesExist[0]) {
        throw new BadRequest("The assigned sales_id does not exist.");
    }

    // 🔍 التحقق من صحة وجود الـ status_id في جدول الحالات (visitStatus) إن أُرسل
    if (status_id) {
        const statusExist = await db
            .select({ id: visitStatus.id })
            .from(visitStatus)
            .where(eq(visitStatus.id, status_id))
            .limit(1);

        if (!statusExist[0]) {
            throw new BadRequest("The assigned status_id does not exist.");
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
    const { lat, lng, name, address, notes, phone, status, status_id, sales_id } = validated.body;
  
    // 🔍 1. التأكد من وجود الزيارة الأصلية
    const existingVisits = await db
        .select()
        .from(visits)
        .where(eq(visits.id, id))
        .limit(1);

    if (!existingVisits[0]) {
        throw new NotFound("Visit not found");
    }

    // 🔍 2. إذا تم طلب تحديث الـ sales_id، نتأكد أنه مستخدم حقيقي وموجود
    if (sales_id !== undefined && sales_id !== null) {
        const salesExist = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, sales_id))
            .limit(1);

        if (!salesExist[0]) {
            throw new BadRequest("The updated sales_id does not exist.");
        }
    }

    // 🔍 3. إذا تم طلب تحديث الـ status_id، نتأكد أنه حالة حقيقية وموجودة
    if (status_id !== undefined && status_id !== null) {
        const statusExist = await db
            .select({ id: visitStatus.id })
            .from(visitStatus)
            .where(eq(visitStatus.id, status_id))
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

    await db.update(visits).set(updateData).where(eq(visits.id, id));

    SuccessResponse(res, { message: "Visit updated successfully" }, 200);
};

// ✅ Delete Visits
export const deleteVisits = async (req: Request, res: Response) => {
    const validated = await VisitIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const existingVisits = await db
        .select()
        .from(visits)
        .where(eq(visits.id, id))
        .limit(1);

    if (!existingVisits[0]) {
        throw new NotFound("Visit not found");
    }
 
    await db.delete(visits).where(eq(visits.id, id));

    SuccessResponse(res, { message: "Visit deleted successfully" }, 200);
};