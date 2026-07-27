// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { targets, users } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import bcrypt from "bcrypt";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";
import { z } from "zod";
import { SQL, and, or, eq, like, count, desc, ne, aliasedTable} from 'drizzle-orm';
// ==========================================
// 🛡️ Zod Validation Schemas
// ==========================================

// الـ Schema الخاص بإنشاء مستخدم Sales (ديناميكي بناءً على الـ Role)
export const getCreateSalesSchema = (userRole?: string) => {
  return z.object({
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
      
      // إذا كان الـ role هو leader، نجعل الحقل اختياري لأننا سنأخذه تلقائياً من الـ Token
      leader_id: userRole === "leader" 
        ? z.string().uuid("Invalid leader ID format").optional()
        : z.string({ required_error: "Leader ID is required" }).uuid("Invalid leader ID format"),
      
      target_id: z.string().uuid("Invalid target ID format").nullable().optional(),

      status: z.enum(["active", "inactive"], {
        required_error: "Status is required",
        invalid_type_error: "Status must be either 'active' or 'inactive'",
      }),
    }),
  });
};

// الـ Schema الخاص بتحديث مستخدم Sales
export const updateSalesSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required" }).uuid("Invalid sales ID format"),
  }),
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").max(200).optional(),
    email: z.string().email("Invalid email format").max(100).optional(),
    phone: z.string().min(5).max(20).optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    image: z.string().nullable().optional(),
    leader_id: z.string().uuid("Invalid leader ID format").optional(), 
    target_id: z.string().uuid("Invalid target ID format").nullable().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});

// الـ Schema للعمليات التي تتطلب المعرف ID فقط
export const salesIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "ID is required" }).uuid("Invalid sales ID format"),
  }),
});


// ==========================================
// 🎮 Controllers
// ==========================================

// ✅ Get All Sales (للـ Organization الحالية مع الـ Targets الخاصة بهم)

// ✅ Get All Sales (للـ Organization الحالية مع الـ Targets الخاصة بهم)
export const getAllSales = async (req: Request, res: Response) => {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    // 1. استقبال معايير الـ Pagination والبحث والفلترة
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string) || '';
    const leaderIdParam = req.query.leader_id ? req.query.leader_id : null;
    
    const offset = (page - 1) * limit;

    // 2. عمل Alias لجدول الـ users لعرض بيانات الـ Leader (Self-Join)
    const leaderAlias = aliasedTable(users, "leaderAlias");

    const whereConditions: SQL[] = [];

    // 3. تطبيق الصلاحيات والفلترة بناءً على الـ Role
    if (userRole === "leader") {
        // قائد الفريق يشوف فقط الـ Sales التابعين له
        whereConditions.push(
            and(
                eq(users.role, "sales"), 
                eq(users.leader_id, userId!)
            ) as SQL
        );
    } else {
        // الأدمن أو الأونر يشوف جميع الـ Sales
        whereConditions.push(eq(users.role, "sales"));

        // إذا الأدمن مرر leader_id محدد في الـ Query
        if (leaderIdParam) {
            whereConditions.push(eq(users.leader_id, userId!));
        }
    }

    // 4. تطبيق البحث (Search) بالاسم، الهاتف، أو البريد الإلكتروني
    if (search.trim()) {
        const searchPattern = `%${search.trim()}%`;
        whereConditions.push(
            or(
                like(users.name, searchPattern),
                like(users.phone, searchPattern),
                like(users.email, searchPattern)
            ) as SQL
        );
    }

    // 5. بناء استعلام البيانات الأساسي (Base Query)
    let query = db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
            target_name: targets.name,
            leader_name: leaderAlias.name,
            leader_phone: leaderAlias.phone,
            status: users.status, 
            createdAt: users.createdAt
        })
        .from(users)
        .leftJoin(targets, eq(users.target_id, targets.id))
        .leftJoin(leaderAlias, eq(users.leader_id, leaderAlias.id))
        .orderBy(desc(users.createdAt))
        .$dynamic();

    // 6. بناء استعلام الـ Count لحساب التوتال
    let countQuery = db
        .select({ total: count() })
        .from(users)
        .$dynamic();

    // ربط الشروط بالاستعلامين
    if (whereConditions.length > 0) {
        const finalWhere = and(...whereConditions);
        query = query.where(finalWhere);
        countQuery = countQuery.where(finalWhere);
    }

    // 7. تنفيذ الاستعلامين بالتوازي (Parallel Execution)
    const [allSales, [{ total: totalCount }]] = await Promise.all([
        query.limit(limit).offset(offset),
        countQuery
    ]);

    // 8. إرسال النتيجة
    return SuccessResponse(res, { 
        sales: allSales,
        pagination: {
            total: Number(totalCount),
            page,
            limit,
            totalPages: Math.ceil(Number(totalCount) / limit)
        }
    }, 200);
};

// ✅ Get Targets List (لإستخدامها في القائمة المنسدلة مثلاً)
export const lists = async (req: Request, res: Response) => {
    const target_list = await db
        .select({
            id: targets.id,
            name: targets.name, 
        })
        .from(targets); 

    const leaders = await db
        .select({
            id: users.id,
            name: users.name, 
        })
        .from(users)
        .where(eq(users.role, "leader"));

    SuccessResponse(res, { target_list, leaders }, 200);
};

// ✅ Get Sales By ID
export const getSalesById = async (req: Request, res: Response) => {
    const validated = await salesIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 

    const sales = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
            target_id: users.target_id,
            leader_id: users.leader_id,
            status: users.status, 
        })
        .from(users) 
        .where(and(eq(users.id, id), eq(users.role, "sales")))
        .limit(1);

    if (!sales[0]) {
        throw new NotFound("Sales not found");
    }

    SuccessResponse(res, { sales: sales[0] }, 200);
};

// ✅ Create Sales
export const createSales = async (req: Request, res: Response) => {
    // 1. التحقق من البيانات عبر الـ Schema الديناميكية
    const validated = await getCreateSalesSchema(req.user?.role).parseAsync({ body: req.body });
    const { name, email, password, phone, image, target_id, status } = validated.body;
    
    // 2. تحديد الـ leader_id بناءً على الـ Role لمنع التلاعب بالبيانات
    let leader_id: string | undefined;

    if (req.user?.role === "leader") {
        leader_id = req.user.id; // يتم إجبار استخدام الـ ID الخاص به
    } else {
        leader_id = validated.body.leader_id; // يتم أخذه من المدخلات المفحوصة للأدمن أو الأونر
    }

    if (!leader_id) {
        throw new BadRequest("Leader ID is required for this operation");
    }

    // 3. تحقق من وجود الـ Leader وصحة الـ Role الخاص به
    const targetLeader = await db
        .select()
        .from(users)
        .where(and(eq(users.id, leader_id), eq(users.role, "leader")))
        .limit(1);

    if (!targetLeader[0]) {
        throw new BadRequest("The assigned leader was not found or is invalid");
    }

    // 4. تحقق من عدم تكرار البريد الإلكتروني أو الهاتف لحساب آخر
    const existingSales = await db
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.phone, phone)))
        .limit(1);

    if (existingSales[0]) {
        throw new BadRequest("Email or Phone already exists");
    } 

    // 5. تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    let savedSalesImage: string | null = null; 

    if (image) {
        const result = await saveBase64Image(req, image, "sales");
        savedSalesImage = result.url;
    }

    // 6. إدخال البيانات في قاعدة البيانات
    await db.insert(users).values({
        name,
        email,
        phone,
        leader_id, 
        image: savedSalesImage,
        password: hashedPassword,
        role: "sales",
        target_id: target_id || null, 
        status: status, 
    });

    SuccessResponse(res, { message: "Sales created successfully" }, 201);
};

// ✅ Update Sales
export const updateSales = async (req: Request, res: Response) => {
    const validated = await updateSalesSchema.parseAsync({ 
        params: req.params, 
        body: req.body 
    });
    const { id } = validated.params;
    const { name, email, password, phone, image, target_id, status } = validated.body;
  
    // 1. التحقق من وجود الـ Sales نفسه وصحة الـ Role
    const existingSales = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, "sales")))
        .limit(1);

    if (!existingSales[0]) {
        throw new NotFound("Sales not found");
    }

    // 2. حماية وتأمين الـ leader_id عند التحديث
    let leader_id: string | undefined;

    if (req.user?.role === "leader") {
        leader_id = req.user.id; // القائد لا يمكنه تعديل القائد التابع له السيلز
    } else {
        leader_id = validated.body.leader_id; // للأونر أو الأدمن يمكنهم تعديله إذا تم إرساله
    } 

    // 3. تحقق من صحة الـ Leader الجديد إذا تم تعديله أو إرساله
    if (leader_id) {
        const targetLeader = await db
            .select()
            .from(users)
            .where(and(eq(users.id, leader_id), eq(users.role, "leader")))
            .limit(1);

        if (!targetLeader[0]) {
            throw new BadRequest("The assigned leader was not found or is invalid");
        }
    }

    // 4. تحقق من البريد الإلكتروني المكرر لغير هذا الحساب
    if (email && email !== existingSales[0].email) {
        const duplicateEmail = await db
            .select()
            .from(users)
            .where(and(eq(users.email, email), ne(users.id, id)))
            .limit(1);

        if (duplicateEmail[0]) {
            throw new BadRequest("Email already exists");
        }
    } 

    // 5. تحقق من الهاتف المكرر لغير هذا الحساب
    if (phone && phone !== existingSales[0].phone) {
        const duplicatePhone = await db
            .select()
            .from(users)
            .where(and(eq(users.phone, phone), ne(users.id, id)))
            .limit(1);

        if (duplicatePhone[0]) {
            throw new BadRequest("Phone already exists");
        }
    }

    // 6. معالجة الصور والتعديلات عليها
    let salesImage = existingSales[0].image;

    if (image !== undefined) {
        if (image) {
            const result = await saveBase64Image(req, image, "sales");
            if (existingSales[0].image) {
                await deletePhotoFromServer(existingSales[0].image);
            }
            salesImage = result.url;
        } else {
            if (existingSales[0].image) {
                await deletePhotoFromServer(existingSales[0].image);
            }
            salesImage = null;
        }
    }

    // 7. بناء كائن التعديل لتجنب إرسال undefined لقاعدة البيانات
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (salesImage !== undefined) updateData.image = salesImage;
    if (leader_id !== undefined) updateData.leader_id = leader_id;
    if (status !== undefined) updateData.status = status;
    if (target_id !== undefined) updateData.target_id = target_id;

    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    SuccessResponse(res, { message: "Sales updated successfully" }, 200);
};

// ✅ Delete Sales
export const deleteSales = async (req: Request, res: Response) => {
    const validated = await salesIdSchema.parseAsync({ params: req.params });
    const { id } = validated.params; 
  
    const existingSales = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, "sales")))
        .limit(1);

    if (!existingSales[0]) {
        throw new NotFound("Sales not found");
    }

    if (existingSales[0].image) {
        await deletePhotoFromServer(existingSales[0].image);
    }

    await db.delete(users).where(eq(users.id, id));

    SuccessResponse(res, { message: "Sales deleted successfully" }, 200);
};