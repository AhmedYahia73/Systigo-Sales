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

// ✅ Get All Sales (للـ Organization الحالية مع الـ Targets الخاصة بهم)
export const getAllSales = async (req: Request, res: Response) => {
    const allusers = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
            target: targets.name,
            target_number: targets.number,
            leader_name: users.name,
            leader_phone: users.phone,
        })
        .from(users)
        .leftJoin(targets, eq(users.target_id, targets.id))
        .leftJoin(users, eq(users.leader_id, users.id))
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
    .where(eq(users.role, "leader"))


    SuccessResponse(res, { target_list: target_list, leaders }, 200);
};

// ✅ Get Sales By ID
export const getSalesById = async (req: Request, res: Response) => {
    const { id } = req.params; 

    const sales = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
            target_id: users.target_id,
            leader_id: users.leader_id,
        })
        .from(users) 
        .where(eq(users.id, id))
        .limit(1);

    if (!sales[0]) {
        throw new NotFound("Sales not found");
    }

    SuccessResponse(res, { sales: sales[0] }, 200);
};

// ✅ Create Sales
export const createSales = async (req: Request, res: Response) => {
    const { name, email, password, phone, image, target_id, leader_id } = req.body;
    
    // تحقق من عدم وجود Sales بنفس الـ email أو الـ phone
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
        target_id: target_id || null, // حفظ الـ Target للموظف إن وجد
    });

    SuccessResponse(res, { message: "Sales created successfully" }, 201);
};

// ✅ Update Sales
export const updateSales = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password, phone, image, target_id, leader_id } = req.body;
  
    // تحقق من وجود الـ Sales
    const existingSales = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    if (!existingSales[0]) {
        throw new NotFound("Sales not found");
    }

    // تحقق من الـ email لو كان تم تعديله
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

    let salesImage = existingSales[0].image;

    if (image !== undefined) {
        if (image) {
            const result = await saveBase64Image(req, image, "sales");
            // حذف الصورة القديمة من السيرفر بعد رفع الجديدة بنجاح
            if (existingSales[0].image) {
                await deletePhotoFromServer(existingSales[0].image);
            }
            salesImage = result.url;
        } else {
            // إذا تم إرسال صورة فارغة نقوم بحذف القديمة وتصفير الحقل
            if (existingSales[0].image) {
                await deletePhotoFromServer(existingSales[0].image);
            }
            salesImage = null;
        }
    }

    const updateData: any = {
        name: name ?? existingSales[0].name,
        email: email ?? existingSales[0].email,
        phone: phone !== undefined ? phone : existingSales[0].phone,
        image: salesImage,
        leader_id: leader_id ?? existingSales[0].leader_id,
        target_id: target_id !== undefined ? target_id : existingSales[0].target_id,
    };

    // لو تم إرسال كلمة مرور جديدة نقوم بتشفيرها وحفظها
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    SuccessResponse(res, { message: "Sales updated successfully" }, 200);
};

// ✅ Delete Sales
export const deleteSales = async (req: Request, res: Response) => {
    const { id } = req.params; 
  
    const existingSales = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    if (!existingSales[0]) {
        throw new NotFound("Sales not found");
    }

    // حذف الصورة الخاصة به من السيرفر قبل حذف الحساب
    if (existingSales[0].image) {
        await deletePhotoFromServer(existingSales[0].image);
    }

    await db.delete(users).where(eq(users.id, id));

    SuccessResponse(res, { message: "Sales deleted successfully" }, 200);
};