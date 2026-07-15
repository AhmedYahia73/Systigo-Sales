// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { visitStatus } from "../../models/schema";
import { eq } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";

// ✅ Get All Targets
export const getAllTargets = async (req: Request, res: Response) => {
    // بناء الاستعلام الأساسي لجلب حالات الزيارة
    const query = db
        .select({
            id: visitStatus.id,
            name: visitStatus.name,
            status: visitStatus.status, 
        })
        .from(visitStatus);
  
    const alltargets = await query;

    // إرسال الرد
    SuccessResponse(res, { sales: alltargets }, 200);
}; 

// ✅ Get Targets By ID
export const getTargetsById = async (req: Request, res: Response) => {
    const { id } = req.params; 

    const Targets = await db
        .select({
            id: visitStatus.id, 
            name: visitStatus.name, 
            status: visitStatus.status, 
        })
        .from(visitStatus) 
        .where(eq(visitStatus.id, id))
        .limit(1);

    if (!Targets[0]) {
        throw new NotFound("Targets not found");
    }

    SuccessResponse(res, { Targets: Targets[0] }, 200);
};

// ✅ Create Targets
export const createTargets = async (req: Request, res: Response) => {
    const { status, name } = req.body;
    
    await db.insert(visitStatus).values({
        status,
        name,
    });

    SuccessResponse(res, { message: "Targets created successfully" }, 201);
};

// ✅ Update Targets
export const updateTargets = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, name } = req.body;
  
    const updateData: any = {
        status,
        name, 
    }; 

    await db.update(visitStatus).set(updateData).where(eq(visitStatus.id, id));

    SuccessResponse(res, { message: "Targets updated successfully" }, 200);
};

// ✅ Delete Targets
export const deleteTargets = async (req: Request, res: Response) => {
    const { id } = req.params; 

    const existingTargets = await db
        .select()
        .from(visitStatus)
        .where(eq(visitStatus.id, id))
        .limit(1);

    if (!existingTargets[0]) {
        throw new NotFound("Targets not found");
    }
 
    await db.delete(visitStatus).where(eq(visitStatus.id, id));

    SuccessResponse(res, { message: "Targets deleted successfully" }, 200);
};