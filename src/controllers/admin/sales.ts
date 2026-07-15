// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { targets, users } from "../../models/schema";
import { eq, and, ne, or } from "drizzle-orm";
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

// الـ Schema الخاص بإنشاء مستخدم Sales جديد
export const createSalesSchema = z.object({
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
    
    leader_id: z.string({ required_error: "Leader ID is required" })
      .uuid("Invalid leader ID format"),
    
    target_id: z.string().uuid("Invalid target ID format").nullable().optional(),

    status: z.enum(["active", "inactive"], {
      required_error: "Status is required",
      invalid_type_error: "Status must be either 'active' or 'inactive'",
    }),
  }),
});

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
export const getAllSales = async (req: Request, res: Response) => {
    // جلب قائد الفريق الآخر بربط ذاتي (Self Join) لعرض بيانات الـ Leader
    const leaderAlias = db.$with("leaderAlias").as(
        db.select().from(users)
    );

    const allusers = await db
        .with(leaderAlias)
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
            target: targets.name,
            target_number: targets.number,
            leader_name: leaderAlias.name,
            leader_phone: leaderAlias.phone,
            status: users.status, 
        })
        .from(users)
        .leftJoin(targets, eq(users.target_id, targets.id))
        .leftJoin(leaderAlias, eq(users.leader_id, leaderAlias.id))
        .where(eq(users.role, "sales"));

    SuccessResponse(res, { sales: allusers }, 200);
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
    const validated = await createSalesSchema.parseAsync({ body: req.body });
    const { name, email, password, phone, image, target_id, leader_id, status } = validated.body;
    
    // 1. تحقق من وجود الـ Leader وصحة الـ Role الخاص به
    const targetLeader = await db
        .select()
        .from(users)
        .where(and(eq(users.id, leader_id), eq(users.role, "leader")))
        .limit(1);

    if (!targetLeader[0]) {
        throw new BadRequest("The assigned leader was not found or is invalid");
    }

    // 2. تحقق من عدم تكرار البريد الإلكتروني أو الهاتف لحساب آخر
    const existingSales = await db
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.phone, phone)))
        .limit(1);

    if (existingSales[0]) {
        throw new BadRequest("Email or Phone already exists");
    } 

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    let savedSalesImage: string | null = null; 

    if (image) {
        const result = await saveBase64Image(req, image, "sales");
        savedSalesImage = result.url;
    }

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
    const { name, email, password, phone, image, target_id, leader_id, status } = validated.body;
  
    // 1. تحقق من وجود الـ Sales نفسه وصحة الـ Role
    const existingSales = await db
        .select()
        .from(users)
        .where(and(eq(users.id, id), eq(users.role, "sales")))
        .limit(1);

    if (!existingSales[0]) {
        throw new NotFound("Sales not found");
    }

    // 2. تحقق من صحة الـ Leader الجديد إذا تم إرساله
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

    // 3. تحقق من البريد الإلكتروني المكرر
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

    // 4. تحقق من الهاتف المكرر
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