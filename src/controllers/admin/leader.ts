// src/controllers/Leader/LeaderController.ts

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

// ✅ Get All Leaders (للـ Organization الحالية مع الـ Targets الخاصة بهم)
export const getAllLeader = async (req: Request, res: Response) => {
    const allusers = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
            target: targets.name,
            target_number: targets.number,
        })
        .from(users)
        .leftJoin(targets, eq(users.target_id, targets.id))
        .where(eq(users.role, "leader"));

    SuccessResponse(res, { leaders: allusers }, 200);
};

// ✅ Get Targets List (لإستخدامها في القائمة المنسدلة)
export const lists = async (req: Request, res: Response) => {
    const target_list = await db
        .select({
            id: targets.id,
            name: targets.name, 
        })
        .from(targets); 

    SuccessResponse(res, { target_list: target_list }, 200);
};

// ✅ Get Leader By ID
export const getLeaderById = async (req: Request, res: Response) => {
    const { id } = req.params; 

    const leader = await db
        .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            image: users.image,
            target_id: users.target_id,
        })
        .from(users) 
        .where(eq(users.id, id))
        .limit(1);

    if (!leader[0]) {
        throw new NotFound("Leader not found");
    }

    SuccessResponse(res, { leader: leader[0] }, 200);
};

// ✅ Create Leader
export const createLeader = async (req: Request, res: Response) => {
    const { name, email, password, phone, image, target_id } = req.body;
    
    // تحقق من عدم وجود Leader بنفس الـ email أو الـ phone
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
    });

    SuccessResponse(res, { message: "Leader created successfully" }, 201);
};

// ✅ Update Leader
export const updateLeader = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password, phone, image, target_id } = req.body;
    
    // تحقق من وجود الـ Leader
    const existingLeader = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    if (!existingLeader[0]) {
        throw new NotFound("Leader not found");
    }

    // لو قام بتغيير الـ email، نتحقق إنه مش مكرر لمستخدم آخر
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

    let leaderImage = existingLeader[0].image;

    if (image !== undefined) {
        if (image) {
            const result = await saveBase64Image(req, image, "leader");
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

    const updateData: any = {
        name: name ?? existingLeader[0].name,
        email: email ?? existingLeader[0].email,
        phone: phone !== undefined ? phone : existingLeader[0].phone,
        image: leaderImage,
        target_id: target_id !== undefined ? target_id : existingLeader[0].target_id,
    };

    // لو تم إرسال password جديد
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    SuccessResponse(res, { message: "Leader updated successfully" }, 200);
};

// ✅ Delete Leader
export const deleteLeader = async (req: Request, res: Response) => {
    const { id } = req.params;  

    const existingLeader = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
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