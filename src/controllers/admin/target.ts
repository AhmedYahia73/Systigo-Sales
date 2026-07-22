// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { targets, target_items, target_sales, users } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { z } from "zod";
import crypto from "crypto";

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

    items: z.array(
      z.object({
        year: z.number({ required_error: "Year is required" }).int(),
        month: z.number({ required_error: "Month is required" }).int().min(1).max(12),
        number: z.number({ required_error: "Monthly target number is required" }).positive(),
      }),
      { required_error: "Items are required" }
    ).min(1, "At least one target item is required"),

    sales: z.array(
      z.string({ invalid_type_error: "Sales User ID must be a string" }).uuid("Invalid User ID format"),
      { required_error: "Sales users array is required" }
    ).min(1, "At least one sales user must be assigned"),
  }),
});

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
      createdAt: targets.createdAt,
    })
    .from(targets);

  if (type) {
    query = query.where(eq(targets.type, type)) as typeof query;
  }

  const alltargets = await query;
  SuccessResponse(res, { targets: alltargets }, 200);
}; 

// ✅ Get Target By ID (معدلة لجلب التارجت مع الـ items والـ sales المعنيين)
export const getTargetsById = async (req: Request, res: Response) => {
  const validated = await targetIdSchema.parseAsync({ params: req.params });
  const { id } = validated.params; 

  // 1. جلب التارجت الرئيسي
  const targetResult = await db
    .select({
      id: targets.id,
      type: targets.type, 
      name: targets.name,
      createdAt: targets.createdAt,
      updatedAt: targets.updatedAt,
    })
    .from(targets) 
    .where(eq(targets.id, id))
    .limit(1);

  const target = targetResult[0];

  if (!target) {
    throw new NotFound("Target not found");
  }

  // 2. جلب العناصر المرتبطة (target_items) واستعلام المبيعات (target_sales) بالتوازي لمستوى أداء أسرع
  const [items, salesList] = await Promise.all([
    db
      .select({
        id: target_items.id,
        year: target_items.year,
        month: target_items.month,
        number: target_items.number,
      })
      .from(target_items)
      .where(eq(target_items.target_id, id)),

    db
      .select({
        id: target_sales.id,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        },
      })
      .from(target_sales)
      .innerJoin(users, eq(target_sales.user_id, users.id))
      .where(eq(target_sales.target_id, id)),
  ]);

  SuccessResponse(
    res, 
    { 
      target: {
        ...target,
        items,
        sales: salesList,
      } 
    }, 
    200
  );
};

// ✅ Create Targets
export const createTargets = async (req: Request, res: Response) => {
  const validated = await createTargetSchema.parseAsync({ body: req.body });
  const { type, name, items, sales } = validated.body;

  const targetId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    // 1. إدخال التارجت الرئيسي
    await tx.insert(targets).values({
      id: targetId,
      type,
      name,
    });

    // 2. إدخال عناصر التارجت (items)
    const itemsToInsert = items.map(item => ({
      target_id: targetId,
      year: item.year,
      month: item.month,
      number: item.number
    }));
    await tx.insert(target_items).values(itemsToInsert);

    // 3. إدخال الموظفين المسند لهم التارجت (sales)
    const salesToInsert = sales.map(userId => ({
      target_id: targetId,
      user_id: userId
    }));
    await tx.insert(target_sales).values(salesToInsert);
  });

  SuccessResponse(res, { id: targetId, message: "Target along with items and sales assigned successfully" }, 201);
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
    .select({ id: targets.id })
    .from(targets)
    .where(eq(targets.id, id))
    .limit(1);

  if (!existingTargets[0]) {
    throw new NotFound("Target not found");
  }

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
    .select({ id: targets.id })
    .from(targets)
    .where(eq(targets.id, id))
    .limit(1);

  if (!existingTargets[0]) {
    throw new NotFound("Target not found");
  }

  // سيتم حذف target_items و target_sales أوتوماتيكياً بسبب onDelete: "cascade"
  await db.delete(targets).where(eq(targets.id, id));

  SuccessResponse(res, { message: "Target deleted successfully" }, 200);
};