// src/controllers/admin/adminController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { users } from "../../models/schema";
import { eq, and, ne, or } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";
import bcrypt from "bcrypt";
import { saveBase64Image } from "../../utils/handleImages";
import { deletePhotoFromServer } from "../../utils/deleteImage";

// ✅ Get All Admins (للـ Organization الحالية)
export const getAllAdmin = async (req: Request, res: Response) => {
    const allusers = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
        })
        .from(users)
        .where(eq(users.role, "admin"));

    SuccessResponse(res, { admins: allusers }, 200);
};

// ✅ Get Admin By ID
export const getAdminById = async (req: Request, res: Response) => {
    const { id } = req.params; 

    const admin = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
        })
        .from(users) 
        .where(eq(users.id, id))
        .limit(1);

    if (!admin[0]) {
        throw new NotFound("Admin not found");
    }

    SuccessResponse(res, { admin: admin[0] }, 200);
};

// ✅ Create Admin
export const createAdmin = async (req: Request, res: Response) => {
    const { name, email, password, phone, image } = req.body;
    
    // تحقق من عدم وجود admin بنفس الـ email أو الـ phone
    const existingAdmin = await db
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.phone, phone)))
        .limit(1);

    if (existingAdmin[0]) {
        throw new BadRequest("Email or Phone already exists");
    } 

    // Hash الـ password
    const hashedPassword = await bcrypt.hash(password, 10);

    let savedAdminImage: string | null = null; 

    if (image) {
        const result = await saveBase64Image(req, image, "admins");
        savedAdminImage = result.url;
    }

    await db.insert(users).values({
        name,
        email,
        phone,
        image: savedAdminImage,
        password: hashedPassword,
        role: "admin",
    });

    SuccessResponse(res, { message: "Admin created successfully" }, 201);
};

// ✅ Update Admin
export const updateAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password, phone, image } = req.body;
  
    // تحقق من وجود الـ Admin
    const existingAdmin = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    if (!existingAdmin[0]) {
        throw new NotFound("Admin not found");
    }

    // لو بيغير الـ email، نتحقق إنه مش موجود لمستخدم آخر
    if (email && email !== existingAdmin[0].email) {
        const duplicateEmail = await db
            .select()
            .from(users)
            .where(and(eq(users.email, email), ne(users.id, id)))
            .limit(1);

        if (duplicateEmail[0]) {
            throw new BadRequest("Email already exists");
        }
    } 

    let adminImage = existingAdmin[0].image;

    if (image !== undefined) {
        if (image) {
            const result = await saveBase64Image(req, image, "admins");
            // حذف الصورة القديمة من السيرفر بعد رفع الجديدة بنجاح
            if (existingAdmin[0].image) {
                await deletePhotoFromServer(existingAdmin[0].image);
            }
            adminImage = result.url;
        } else {
            // حذف الصورة القديمة وتصفير الحقل إذا تم إرسال قيمة فارغة
            if (existingAdmin[0].image) {
                await deletePhotoFromServer(existingAdmin[0].image);
            }
            adminImage = null;
        }
    }

    const updateData: any = {
        name: name ?? existingAdmin[0].name,
        email: email ?? existingAdmin[0].email,
        phone: phone !== undefined ? phone : existingAdmin[0].phone,
        image: adminImage, 
    };

    // لو فيه password جديد
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    SuccessResponse(res, { message: "Admin updated successfully" }, 200);
};

// ✅ Delete Admin
export const deleteAdmin = async (req: Request, res: Response) => {
    const { id } = req.params; 
 
    const existingAdmin = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    if (!existingAdmin[0]) {
        throw new NotFound("Admin not found");
    }

    // حذف الصورة من السيرفر قبل مسح الحساب
    if (existingAdmin[0].image) {
        await deletePhotoFromServer(existingAdmin[0].image);
    }

    await db.delete(users).where(eq(users.id, id));

    SuccessResponse(res, { message: "Admin deleted successfully" }, 200);
};