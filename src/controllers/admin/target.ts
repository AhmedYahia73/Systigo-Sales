// src/controllers/Sales/SalesController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { targets } from "../../models/schema";
import { eq, and, ne, or } from "drizzle-orm";
import { SuccessResponse } from "../../utils/response";
import { NotFound } from "../../Errors/NotFound";
import { BadRequest } from "../../Errors/BadRequest";

// ✅ Get All Targets
export const getAllTargets = async (req: Request, res: Response) => {
    const type = req.params.type;

    // 1. ابني الاستعلام الأساسي (بدون await)
    let query = db
        .select({
            id: targets.id,
            type: targets.type,
            name: targets.name,
            number: targets.number, 
        })
        .from(targets);

    // 2. ضيف شرط الـ where لو الـ type مبعوث في الـ request
    if (type) {
        query = query.where(eq(targets.type, type)) as typeof query;
    }

    // 3. نفّذ الاستعلام في النهاية باستخدام await
    const alltargets = await query;

    // 4. ابعت الرد
    SuccessResponse(res, { sales: alltargets }, 200);
}; 

// ✅ Get Targets By ID
export const getTargetsById = async (req: Request, res: Response) => {
    const { id } = req.params; 

    const Targets = await db
        .select({
            id: targets.id,
            type: targets.type, 
            name: targets.name, 
            number: targets.number, 
        })
        .from(targets) 
        .where(eq(targets.id, id))
        .limit(1);

    if (!Targets[0]) {
        throw new NotFound("Targets not found");
    }

    SuccessResponse(res, { Targets: Targets[0] }, 200);
};

// ✅ Create Targets
export const createTargets = async (req: Request, res: Response) => {
    const { type, name, number } = req.body;
    
    await db.insert(targets).values({
        type,
        name,
        number,
    });

    SuccessResponse(res, { message: "Targets created successfully" }, 201);
};

// ✅ Update Targets
export const updateTargets = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type, name, number } = req.body;
  
    const updateData: any = {
        type,
        name,
        number,
    }; 

    await db.update(targets).set(updateData).where(eq(targets.id, id));

    SuccessResponse(res, { message: "Targets updated successfully" }, 200);
};

// ✅ Delete Targets
export const deleteTargets = async (req: Request, res: Response) => {
    const { id } = req.params; 

    const existingTargets = await db
        .select()
        .from(targets)
        .where(eq(targets.id, id))
        .limit(1);

    if (!existingTargets[0]) {
        throw new NotFound("Targets not found");
    }
 
    await db.delete(targets).where(eq(targets.id, id));

    SuccessResponse(res, { message: "Targets deleted successfully" }, 200);
};