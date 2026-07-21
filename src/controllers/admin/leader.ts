// src/controllers/Leader/LeaderController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { targets, users } from "../../models/schema"; 
import { SQL, and, or, eq, ilike, count, desc, ne } from 'drizzle-orm';
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import bcrypt from "bcrypt";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { z } from "zod";

// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

// الـ Schema الخاص بإنشاء مستخدم Leader جديد
export const createLeaderSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" })
      .min(1, "Name cannot be empty")
      .max(200, "Name cannot exceed 200 characters"),
    
    email: z.string({ required_error: "Email is required" })
      .email("Invalid email format")
      .max(100, "Email cannot exceed 100 characters"),
    
    phone: z.string({ required_error: "Phone is required" })
      .min(5, "Phone is too short")
      .max(20, "Phone cannot exceed 20 characters"),
    
    password: z.string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
    
    image: z.string().nullable().optional(),
    
    target_id: z.string().uuid("Invalid target ID format").nullable().optional(),
    
    status: z.enum(["active", "inactive"], {
        required_error: "Status is required",
        invalid_type_error: "Status must be either 'active' or 'inactive'",
    }),
  }),
});

// الـ Schema الخاص بتحديث مستخدم Leader
export const updateLeaderSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required" }).uuid("Invalid leader ID format"),
  }),
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").max(200).optional(),
    email: z.string().email("Invalid email format").max(100).optional(),
    phone: z.string().min(5).max(20).optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    image: z.string().nullable().optional(),
    target_id: z.string().uuid("Invalid target ID format").nullable().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

// الـ Schema للعمليات التي تتطلب المعرف ID فقط في الـ parameters
export const leaderIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required" }).uuid("Invalid leader ID format"),
  }),
});


// ==========================================
// 🎮 Controllers
// ==========================================

// ✅ Get All Leaders

export const getAllLeader = async (req: Request, res: Response) => {
    // استقبال معايير الـ Pagination والبحث
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    
    const offset = (page - 1) * limit;

    let whereConditions: SQL[] = [];

    // 1. الفلترة الأساسية: جلب المستخدمين الذين يمتلكون دور "leader" فقط
    whereConditions.push(eq(users.role, "leader"));

    // 2. تطبيق البحث (Search) بالاسم، الهاتف، أو البريد الإلكتروني للقادة
    if (search) {
        const searchPattern = `%${search}%`;
        whereConditions.push(
            or(
                ilike(users.name, searchPattern),
                ilike(users.phone, searchPattern),
                ilike(users.email, searchPattern)
            ) as SQL
        );
    }

    // 3. بناء استعلام البيانات الأساسي (Base Query)
    let query = db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
            target: targets.name, 
            status: users.status, 
            createdAt: users.createdAt
        })
        .from(users)
        .leftJoin(targets, eq(users.target_id, targets.id))
        .orderBy(desc(users.createdAt)) // ترتيب الأحدث أولاً
        .$dynamic();

    // 4. بناء استعلام الـ Count لحساب العدد الإجمالي متوافقاً مع فلاتر البحث
    let countQuery = db
        .select({ total: count() })
        .from(users)
        .$dynamic();

    // ربط الشروط بالاستعلامات
    if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
        countQuery = countQuery.where(and(...whereConditions));
    }

    // 5. تنفيذ الاستعلامين بالتوازي (Parallel Execution) لتقليل زمن الاستجابة
    const [allLeaders, [{ total: totalCount }]] = await Promise.all([
        query.limit(limit).offset(offset),
        countQuery
    ]);

    // 6. إرسال النتيجة مع معلومات الـ Pagination الكاملة
    SuccessResponse(res, { 
        leaders: allLeaders,
        pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
        }
    }, 200);
};

// ✅ Get Targets List (لإستخدامها في القائمة المنسدلة)
export const lists = async (req: Request, res: Response) => {
    const target_list = await db
        .select({
            id: targets.id,
            name: targets.name, 
        })
        .from(targets); 

    SuccessResponse(res, { target_list }, 200);
};

// ✅ Get Leader By ID
export const getLeaderById = async (req: Request, res: Response) => {
    const validated = await leaderIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const leader = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
            target_id: users.target_id,
            status: users.status, 
        })
        .from(users) 
        .where(and(eq(users.id, id), eq(users.role, "leader")))
        .limit(1);

    if (!leader[0]) {
        throw new NotFound("Leader not found");
    }

    SuccessResponse(res, { leader: leader[0] }, 200);
};

// ✅ Create Leader
export const createLeader = async (req: Request, res: Response) => {
    const validated = await createLeaderSchema.parseAsync({ body: req.body });
    const { name, email, password, phone, image, target_id, status } = validated.body;
    
    // تحقق من عدم وجود مستخدم آخر بنفس الـ email أو الـ phone
    const existingLeader = await db
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.phone, phone)))
        .limit(1);

    if (existingLeader[0]) {
        throw new BadRequest("Email or Phone already exists");
    } 

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    let savedLeaderImage: string | null = null; 

    if (image) {
        const result = await saveBase64Image(req, image, "leaders");
        savedLeaderImage = result.url;
    }

    await db.insert(users).values({
        name,
        email,
        phone,
        image: savedLeaderImage,
        password: hashedPassword,
        role: "leader",
        target_id: target_id || null, // ربط القائد بالـ target إن وجد
        status: status, 
    });

    SuccessResponse(res, { message: "Leader created successfully" }, 201);
};

// ✅ Update Leader
export const updateLeader = async (req: Request, res: Response) => {
    const validated = await updateLeaderSchema.parseAsync({ 
        params: req.params, 
        body: req.body 
    });
    const { id } = validated.params;
    const { name, email, password, phone, image, target_id, status } = validated.body;
    
    // تحقق من وجود الـ Leader
    const existingLeader = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, "leader")))
        .limit(1);

    if (!existingLeader[0]) {
        throw new NotFound("Leader not found");
    }

    // تحقق من الـ email لو تم تعديله ولم يكرر مع حساب آخر
    if (email && email !== existingLeader[0].email) {
        const duplicateEmail = await db
            .select()
            .from(users)
            .where(and(eq(users.email, email), ne(users.id, id)))
            .limit(1);

        if (duplicateEmail[0]) {
            throw new BadRequest("Email already exists");
        }
    } 

    // تحقق من الـ phone لو تم تعديله ولم يكرر مع حساب آخر
    if (phone && phone !== existingLeader[0].phone) {
        const duplicatePhone = await db
            .select()
            .from(users)
            .where(and(eq(users.phone, phone), ne(users.id, id)))
            .limit(1);

        if (duplicatePhone[0]) {
            throw new BadRequest("Phone already exists");
        }
    }

    let leaderImage = existingLeader[0].image;

    if (image !== undefined) {
        if (image) {
            const result = await saveBase64Image(req, image, "leaders");
            // حذف الصورة القديمة من السيرفر بعد رفع الصورة الجديدة بنجاح
            if (existingLeader[0].image) {
                await deletePhotoFromServer(existingLeader[0].image);
            }
            leaderImage = result.url;
        } else {
            // تصفير الصورة وحذفها من السيرفر إذا أرسل قيمة فارغة
            if (existingLeader[0].image) {
                await deletePhotoFromServer(existingLeader[0].image);
            }
            leaderImage = null;
        }
    }

    // بناء كائن البيانات المحدثة مع تلافي القيم الـ undefined
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (leaderImage !== undefined) updateData.image = leaderImage;
    if (status !== undefined) updateData.status = status;
    if (target_id !== undefined) updateData.target_id = target_id;

    // لو تم إرسال password جديد
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    SuccessResponse(res, { message: "Leader updated successfully" }, 200);
};

// ✅ Delete Leader
export const deleteLeader = async (req: Request, res: Response) => {
    const validated = await leaderIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const existingLeader = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, "leader")))
        .limit(1);

    if (!existingLeader[0]) {
        throw new NotFound("Leader not found");
    }

    // حذف صورة الـ Leader من السيرفر أولاً
    if (existingLeader[0].image) {
        await deletePhotoFromServer(existingLeader[0].image);
    }

    await db.delete(users).where(eq(users.id, id));

    SuccessResponse(res, { message: "Leader deleted successfully" }, 200);
};