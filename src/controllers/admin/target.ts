// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { targets } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { z } from "zod";
import { float } from "drizzle-orm/mysql-core";

// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

// الـ Schema الخاص بإنشاء target جديد
export const createTargetSchema = z.object({
  body: z.object({
    type: z.enum(["visit", "sales"], {
      required_error: "Type is required",
      invalid_type_error: "Type must be either 'visit' or 'sales'",
    }).default("visit"),
    name: z.string({
      required_error: "Name is required",
    })
    .min(1, "Name cannot be empty")
    .max(255, "Name cannot exceed 255 characters"),
    number: z.number({
      required_error: "Number is required",
      invalid_type_error: "Number must be a valid numeric value",
    }),
  }),
});

// الـ Schema الخاص بتحديث target (البيانات اختيارية ولكن إذا أرسلت يجب أن تطابق الأنواع)
export const updateTargetSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }), // غيرها لـ z.coerce.number() لو الـ ID رقم في قاعدة البيانات
  }),
  body: z.object({
    type: z.enum(["visit", "sales"], {
      invalid_type_error: "Type must be either 'visit' or 'sales'",
    }).optional(),
    name: z.string().min(1, "Name cannot be empty").max(255).optional(),
    number: z.number({ invalid_type_error: "Number must be a numeric value" }).optional(),
  }),
});

// الـ Schema الخاص بالعمليات التي تتطلب ID فقط أو الـ query params
export const targetIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }), // غيرها لـ z.coerce.number() لو الـ ID رقم في قاعدة البيانات
  }),
});

// التحقق من الـ Route Params عند جلب الكل بنوع محدد (اختياري)
export const getAllTargetsSchema = z.object({
  params: z.object({
    type: z.enum(["visit", "sales"]).optional(),
  }),
});


// ==========================================
// 🎮 Controllers
// ==========================================

// ✅ Get All Targets
export const getAllTargets = async (req: Request, res: Response) => {
    // التحقق من الـ params إن وُجدت
    const validated = await getAllTargetsSchema.parseAsync({ params: req.params });
    const { type } = validated.params;

    // 1. بناء الاستعلام الأساسي
    let query = db
        .select({
            id: targets.id,
            type: targets.type,
            name: targets.name,
            number: targets.number, 
        })
        .from(targets);

    // 2. تصفية النتائج بناءً على النوع لو تم إرساله
    if (type) {
        query = query.where(eq(targets.type, type)) as typeof query;
    }

    // 3. تنفيذ الاستعلام
    const alltargets = await query;

    // 4. إرسال الرد
    SuccessResponse(res, { sales: alltargets }, 200);
}; 

// ✅ Get Targets By ID
export const getTargetsById = async (req: Request, res: Response) => {
    const validated = await targetIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const Targets = await db
        .select({
            id: targets.id,
            type: targets.type, 
            name: targets.name, 
            number: targets.number, 
        })
        .from(targets) 
        .where(eq(targets.id, id))
        .limit(1);

    if (!Targets[0]) {
        throw new NotFound("Targets not found");
    }

    SuccessResponse(res, { Targets: Targets[0] }, 200);
};

// ✅ Create Targets
export const createTargets = async (req: Request, res: Response) => {
    const validated = await createTargetSchema.parseAsync({ body: req.body });
    const { type, name, number } = validated.body;
    
    await db.insert(targets).values({
        type,
        name,
        number: number, // لو حقل الداتابيز double كـ string أو اتركها number حسب الـ schema عندك
    });

    SuccessResponse(res, { message: "Targets created successfully" }, 201);
};

// ✅ Update Targets
export const updateTargets = async (req: Request, res: Response) => {
    const validated = await updateTargetSchema.parseAsync({ 
        params: req.params, 
        body: req.body 
    });
    const { id } = validated.params;
    const { type, name, number } = validated.body;
  
    // التأكد أولاً من وجود العنصر قبل التحديث
    const existingTargets = await db
        .select()
        .from(targets)
        .where(eq(targets.id, id))
        .limit(1);

    if (!existingTargets[0]) {
        throw new NotFound("Targets not found");
    }

    // بناء كائن التحديث ديناميكياً لتجنب إرسال قيم undefined
    const updateData: Partial<{ type: "visit" | "sales"; name: string; number: number }> = {};
    if (type !== undefined) updateData.type = type;
    if (name !== undefined) updateData.name = name;
    if (number !== undefined) updateData.number = Number(number);
    if(updateData){
        await db.update(targets).set(updateData).where(eq(targets.id, id));
    }

    SuccessResponse(res, { message: "Targets updated successfully" }, 200);
};

// ✅ Delete Targets
export const deleteTargets = async (req: Request, res: Response) => {
    const validated = await targetIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const existingTargets = await db
        .select()
        .from(targets)
        .where(eq(targets.id, id))
        .limit(1);

    if (!existingTargets[0]) {
        throw new NotFound("Targets not found");
    }
 
    await db.delete(targets).where(eq(targets.id, id));

    SuccessResponse(res, { message: "Targets deleted successfully" }, 200);
};