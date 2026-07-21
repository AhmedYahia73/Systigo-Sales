// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { targets, target_items, target_sales } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { z } from "zod";
import crypto from "crypto"; // لتوليد الـ UUID وضمان ربط العلاقات بدقة

// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

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

    // الـ items تحتوي على السنين والشهور والمستهدف الرقمي الخاص بها
    items: z.array(
      z.object({
        year: z.number({ required_error: "Year is required" }).int(),
        month: z.number({ required_error: "Month is required" }).int().min(1).max(12),
        number: z.number({ required_error: "Monthly target number is required" }).positive(),
      }),
      { required_error: "Items are required" }
    ).min(1, "At least one target item is required"),

    // الـ sales مستخدمين مربوطين بهذا التارجت
    sales: z.array(
      z.string({ invalid_type_error: "Sales User ID must be a string" }).uuid("Invalid User ID format"),
      { required_error: "Sales users array is required" }
    ).min(1, "At least one sales user must be assigned"),
  }),
});

// تعديل سكيما التحديث بناءً على الحقول الفعلية في جدول targets فقط
export const updateTargetSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }),
  }),
  body: z.object({
    type: z.enum(["visit", "sales"]).optional(),
    name: z.string().min(1, "Name cannot be empty").max(255).optional(),
  }),
});

export const targetIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }),
  }),
});

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
    const validated = await getAllTargetsSchema.parseAsync({ params: req.params });
    const { type } = validated.params;

    let query = db
        .select({
            id: targets.id,
            type: targets.type,
            name: targets.name,
        })
        .from(targets);

    if (type) {
        query = query.where(eq(targets.type, type)) as typeof query;
    }

    const alltargets = await query;
    SuccessResponse(res, { targets: alltargets }, 200);
}; 

// ✅ Get Targets By ID
export const getTargetsById = async (req: Request, res: Response) => {
    const validated = await targetIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const result = await db
        .select({
            id: targets.id,
            type: targets.type, 
            name: targets.name, 
        })
        .from(targets) 
        .where(eq(targets.id, id))
        .limit(1);

    if (!result[0]) {
        throw new NotFound("Target not found");
    }

    SuccessResponse(res, { target: result[0] }, 200);
};

// ✅ Create Targets (تعديل جذري لربط العلاقات بشكل صحيح وآمن)
export const createTargets = async (req: Request, res: Response) => {
    const validated = await createTargetSchema.parseAsync({ body: req.body });
    const { type, name, items, sales } = validated.body;

    // توليد المعرّف الفريد مسبقاً في السيرفر لضمان ربطه بدقة في الجداول الفرعية
    const targetId = crypto.randomUUID();

    await db.transaction(async (tx) => {
        // 1. إدخال التارجت الرئيسي بالـ id المولّد
        await tx.insert(targets).values({
            id: targetId,
            type,
            name,
        });

        // 2. إدخال العناصر (items) وربطها بالـ targetId
        const itemsToInsert = items.map(item => ({
            target_id: targetId,
            year: item.year,
            month: item.month,
            number: item.number
        }));
        await tx.insert(target_items).values(itemsToInsert);

        // 3. إدخال المبيعات (sales) وربطها بالـ targetId والـ user_id
        const salesToInsert = sales.map(userId => ({
            target_id: targetId,
            user_id: userId
        }));
        await tx.insert(target_sales).values(salesToInsert);
    });

    SuccessResponse(res, { message: "Target along with multiple items and sales created successfully" }, 201);
};

// ✅ Update Targets
export const updateTargets = async (req: Request, res: Response) => {
    const validated = await updateTargetSchema.parseAsync({ 
        params: req.params, 
        body: req.body 
    });
    const { id } = validated.params;
    const bodyData = validated.body;
  
    const existingTargets = await db
        .select()
        .from(targets)
        .where(eq(targets.id, id))
        .limit(1);

    if (!existingTargets[0]) {
        throw new NotFound("Target not found");
    }

    // تنظيف البيانات وعمل التحديث لحقول جدول الـ targets الفعلي فقط (type أو name)
    const updateData = Object.fromEntries(
        Object.entries(bodyData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updateData).length > 0) {
        await db.update(targets).set(updateData).where(eq(targets.id, id));
    }

    SuccessResponse(res, { message: "Target updated successfully" }, 200);
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
        throw new NotFound("Target not found");
    }
 
    // ميزة الـ onDelete: "cascade" التي قمت بتعريفها في جداولك 
    // ستقوم بحذف جميع الـ items والـ sales المرتبطة بهذا المعرف تلقائياً من قاعدة البيانات.
    await db.delete(targets).where(eq(targets.id, id));

    SuccessResponse(res, { message: "Target deleted successfully" }, 200);
};