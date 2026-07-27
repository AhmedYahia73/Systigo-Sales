// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { wishList } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { z } from "zod"; 
import { SQL, and, or, like, count, desc } from 'drizzle-orm';
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

// الـ Schema الخاص بإنشاء WishList جديد
export const createWishListSchema = z.object({
  body: z.object({ 
    name: z.string({ required_error: "Name is required" })
      .min(1, "Name cannot be empty")
      .max(255, "Name cannot exceed 255 characters"),
    description: z.string().max(255, "Description cannot exceed 255 characters").nullable().optional(), 
  }),
});

// الـ Schema الخاص بتحديث WishList
export const updateWishListSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format"), // تم التحقق كـ UUID ليتطابق مع المعايير الشائعة
  }),
  body: z.object({ 
    name: z.string().min(1, "Name cannot be empty").max(255).optional(),
    description: z.string().max(255, "Description cannot exceed 255 characters").nullable().optional(), 
  }),
});

// الـ Schema الخاص بالعمليات التي تتطلب ID فقط
export const WishListIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required in parameters" }).uuid("Invalid ID format"),
  }),
}); 


// ==========================================
// 🎮 Controllers
// ==========================================

// ✅ Get All WishLists

export const getAllWishLists = async (req: Request, res: Response) => { 
    // استقبال معايير الـ Pagination والبحث
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    
    const offset = (page - 1) * limit;

    let whereConditions: SQL[] = [];

    // 1. تطبيق البحث (Search) باسم قائمة الأمنيات أو وصفها
    if (search) {
        const searchPattern = `%${search}%`;
        whereConditions.push(
            or(
                like(wishList.name, searchPattern),
                like(wishList.description, searchPattern)
            ) as SQL
        );
    }

    // 2. بناء استعلام البيانات الأساسي (Base Query)
    let query = db
        .select({
            id: wishList.id, 
            name: wishList.name,
            description: wishList.description, 
            createdAt: wishList.createdAt // تأكد من وجود هذا الحقل في الموديل للترتيب، أو استبدله بـ wishList.id
        })
        .from(wishList)
        .orderBy(desc(wishList.createdAt)) // ترتيب الأحدث أولاً
        .$dynamic();

    // 3. بناء استعلام الـ Count لحساب العدد الإجمالي متوافقاً مع فلاتر البحث
    let countQuery = db
        .select({ total: count() })
        .from(wishList)
        .$dynamic();

    // ربط الشروط بالاستعلامات
    if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
        countQuery = countQuery.where(and(...whereConditions));
    }

    // 4. تنفيذ الاستعلامين بالتوازي (Parallel Execution) لسرعة استجابة فائقة
    const [allWishLists, [{ total: totalCount }]] = await Promise.all([
        query.limit(limit).offset(offset),
        countQuery
    ]);
 
    // 5. إرسال النتيجة مع معلومات الـ Pagination الكاملة
    SuccessResponse(res, { 
        allWishLists,
        pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    }, 200);
};

// ✅ Get WishLists By ID
export const getWishListsById = async (req: Request, res: Response) => {
    const validated = await WishListIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const WishLists = await db
        .select({
            id: wishList.id, 
            name: wishList.name, 
            description: wishList.description, 
        })
        .from(wishList) 
        .where(eq(wishList.id, id))
        .limit(1);

    if (!WishLists[0]) {
        throw new NotFound("WishList not found");
    }

    SuccessResponse(res, { WishList: WishLists[0] }, 200);
};

// ✅ Create WishLists
export const createWishLists = async (req: Request, res: Response) => {
    const validated = await createWishListSchema.parseAsync({ body: req.body });
    const { name, description } = validated.body;
    
    await db.insert(wishList).values({ 
        name,
        description: description || null,
    });

    SuccessResponse(res, { message: "WishList created successfully" }, 201);
};

// ✅ Update WishLists
export const updateWishLists = async (req: Request, res: Response) => {
    const validated = await updateWishListSchema.parseAsync({ 
        params: req.params, 
        body: req.body 
    });
    const { id } = validated.params;
    const { name, description } = validated.body;
  
    // التأكد أولاً من وجود العنصر قبل التحديث
    const existingWishLists = await db
        .select()
        .from(wishList)
        .where(eq(wishList.id, id))
        .limit(1);

    if (!existingWishLists[0]) {
        throw new NotFound("WishList not found");
    }

    // بناء كائن التحديث ديناميكياً لتجنب إرسال قيم undefined
    const updateData: Partial<{ name: string; description: string | null }> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await db.update(wishList).set(updateData).where(eq(wishList.id, id));

    SuccessResponse(res, { message: "WishList updated successfully" }, 200);
};

// ✅ Delete WishLists
export const deleteWishLists = async (req: Request, res: Response) => {
    const validated = await WishListIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const existingWishLists = await db
        .select()
        .from(wishList)
        .where(eq(wishList.id, id))
        .limit(1);

    if (!existingWishLists[0]) {
        throw new NotFound("WishList not found");
    }
 
    await db.delete(wishList).where(eq(wishList.id, id));

    SuccessResponse(res, { message: "WishList deleted successfully" }, 200);
};