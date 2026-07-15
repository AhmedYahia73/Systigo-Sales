// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { visitStatus } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { z } from "zod";

// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

// الـ Schema الخاص بإنشاء هدف جديد
export const createVisitStatusSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required",
    }).min(1, "Name cannot be empty"),
    status: z.boolean({
      required_error: "Status is required",
      invalid_type_error: "Status must be a boolean (true or false)",
    }),
  }),
});

// الـ Schema الخاص بتحديث هدف (البيانات اختيارية ولكن إذا أُرسلت يجب أن تكون صالحة)
export const updateVisitStatusSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }), // غيرها لـ z.coerce.number() لو الـ ID رقم في الداتابيز
  }),
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    status: z.boolean({ invalid_type_error: "Status must be a boolean" }).optional(),
  }),
});

// الـ Schema الخاص بالعمليات التي تتطلب ID فقط (مثل جلب عنصر محدد أو حذفه)
export const VisitStatusIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }), // غيرها لـ z.coerce.number() لو الـ ID رقم
  }),
});


// ==========================================
// 🎮 Controllers
// ==========================================

// ✅ Get All VisitStatuss
export const getAllVisitStatuss = async (req: Request, res: Response) => {
    // بناء الاستعلام الأساسي لجلب حالات الزيارة
    const query = db
        .select({
            id: visitStatus.id,
            name: visitStatus.name,
            status: visitStatus.status, 
        })
        .from(visitStatus);
  
    const allVisitStatuss = await query;

    // إرسال الرد
    SuccessResponse(res, { allVisitStatuss: allVisitStatuss }, 200);
}; 

// ✅ Get VisitStatuss By ID
export const getVisitStatussById = async (req: Request, res: Response) => {
    // التحقق من صحة الـ ID المبعوث في الـ Params
    const validated = await VisitStatusIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const VisitStatuss = await db
        .select({
            id: visitStatus.id, 
            name: visitStatus.name, 
            status: visitStatus.status, 
        })
        .from(visitStatus) 
        .where(eq(visitStatus.id, id))
        .limit(1);

    if (!VisitStatuss[0]) {
        throw new NotFound("VisitStatuss not found");
    }

    SuccessResponse(res, { VisitStatuss: VisitStatuss[0] }, 200);
};

// ✅ Create VisitStatuss
export const createVisitStatuss = async (req: Request, res: Response) => {
    // التحقق من صحة البيانات المرسلة في الـ Body
    const validated = await createVisitStatusSchema.parseAsync({ body: req.body });
    const { status, name } = validated.body;
    
    await db.insert(visitStatus).values({
        status,
        name,
    });

    SuccessResponse(res, { message: "VisitStatuss created successfully" }, 201);
};

// ✅ Update VisitStatuss
export const updateVisitStatuss = async (req: Request, res: Response) => {
    // التحقق من الـ ID والبيانات المرسلة للتعديل
    const validated = await updateVisitStatusSchema.parseAsync({ 
        params: req.params, 
        body: req.body 
    });
    const { id } = validated.params;
    const { status, name } = validated.body;
  
    // التأكد أولاً من أن الـ VisitStatus موجود بالفعل في قاعدة البيانات
    const existingVisitStatuss = await db
        .select()
        .from(visitStatus)
        .where(eq(visitStatus.id, id))
        .limit(1);

    if (!existingVisitStatuss[0]) {
        throw new NotFound("VisitStatuss not found");
    }

    // بناء كائن التحديث ديناميكياً لتجنب إرسال قيم undefined للداتابيز
    const updateData: Partial<{ status: boolean; name: string }> = {};
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;

    await db.update(visitStatus).set(updateData).where(eq(visitStatus.id, id));

    SuccessResponse(res, { message: "VisitStatuss updated successfully" }, 200);
};

// ✅ Delete VisitStatuss
export const deleteVisitStatuss = async (req: Request, res: Response) => {
    // التحقق من الـ ID المبعوث في الـ Params
    const validated = await VisitStatusIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const existingVisitStatuss = await db
        .select()
        .from(visitStatus)
        .where(eq(visitStatus.id, id))
        .limit(1);

    if (!existingVisitStatuss[0]) {
        throw new NotFound("VisitStatuss not found");
    }
 
    await db.delete(visitStatus).where(eq(visitStatus.id, id));

    SuccessResponse(res, { message: "VisitStatuss deleted successfully" }, 200);
};