// src/controllers/auth/authController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { users, salesProjects, salesProjectUsers } from "../../models/schema";
import { eq, and, desc } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generateUserToken } from "../../utils/auth";
import { UnauthorizedError } from "../../Errors";
import { BadRequest } from "../../Errors/BadRequest";
import { NotFound } from "../../Errors/NotFound";
import { SuccessResponse } from "../../utils/response";

// ✅ Fetch All Sales Projects for Login Selector
export async function getSalesProjects(req: Request, res: Response) {
  const allProjects = await db
    .select({
      id: salesProjects.id,
      name: salesProjects.name,
      logo: salesProjects.logo,
      design: salesProjects.design,
    })
    .from(salesProjects)
    .orderBy(desc(salesProjects.createdAt));

  return SuccessResponse(res, { salesProjects: allProjects }, 200);
}

// ✅ Fetch Project Details By ID
export async function getProjectDetails(req: Request, res: Response) {
  const { id } = req.params;
  const [project] = await db
    .select({
      id: salesProjects.id,
      name: salesProjects.name,
      logo: salesProjects.logo,
      design: salesProjects.design,
    })
    .from(salesProjects)
    .where(eq(salesProjects.id, id))
    .limit(1);

  if (!project) {
    throw new NotFound("Sales project not found");
  }

  return SuccessResponse(res, { project }, 200);
}

// ✅ User Login with Project Selection & Verification
export async function login(req: Request, res: Response) {
  const { email, password, project_id } = req.body;

  // 1) جلب المستخدم بالإيميل
  const admin = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!admin[0]) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 2) التحقق من الباسورد
  const match = await bcrypt.compare(password, admin[0].password);
  if (!match) {
    throw new UnauthorizedError("Invalid email or password");
  }

  // 3) التحقق من حالة الحساب
  if (admin[0].status !== "active") {
    throw new UnauthorizedError("Your account is inactive");
  }

  const userRole = admin[0].role;
  let selectedProject: any = null;

  // 4) التحقق من المشروع وصلاحيات الوصول إليه
  if (project_id) {
    const [proj] = await db
      .select({
        id: salesProjects.id,
        name: salesProjects.name,
        logo: salesProjects.logo,
        design: salesProjects.design,
      })
      .from(salesProjects)
      .where(eq(salesProjects.id, project_id))
      .limit(1);

    if (!proj) {
      throw new BadRequest("المشروع المختار غير موجود (Selected sales project not found)");
    }

    selectedProject = proj;

    // التحقق من تعيين المستخدم على هذا المشروع في حال كان sales أو leader
    if (userRole === "sales" || userRole === "leader") {
      const [assigned] = await db
        .select()
        .from(salesProjectUsers)
        .where(
          and(
            eq(salesProjectUsers.sales_project_id, project_id),
            eq(salesProjectUsers.user_id, admin[0].id)
          )
        )
        .limit(1);

      if (!assigned) {
        throw new UnauthorizedError("عفواً، لست معيناً على هذا المشروع (You are not assigned to this project)");
      }
    }
  } else if (userRole === "sales" || userRole === "leader") {
    // في حال لم يتم إرسال project_id صراحة، نحاول استخراج أول مشروع معين عليه
    const assigned = await db
      .select({ sales_project_id: salesProjectUsers.sales_project_id })
      .from(salesProjectUsers)
      .where(eq(salesProjectUsers.user_id, admin[0].id))
      .limit(1);

    if (assigned[0]?.sales_project_id) {
      const [proj] = await db
        .select({
          id: salesProjects.id,
          name: salesProjects.name,
          logo: salesProjects.logo,
          design: salesProjects.design,
        })
        .from(salesProjects)
        .where(eq(salesProjects.id, assigned[0].sales_project_id))
        .limit(1);

      if (proj) {
        selectedProject = proj;
      }
    }
  }

  // 5) إعداد بيانات التوكن بما فيها project_id وبيانات الهوية
  const effectiveProjectId = selectedProject ? selectedProject.id : project_id || undefined;
  const tokenPayload: any = {
    id: admin[0].id,
    role: admin[0].role,
    email: admin[0].email,
    name: admin[0].name,
    phone: admin[0].phone,
    project_id: effectiveProjectId,
    project_name: selectedProject?.name,
    project_logo: selectedProject?.logo,
    project_design: selectedProject?.design,
  };

  const token = generateUserToken(tokenPayload);

  // 6) إرسال الاستجابة الناجحة
  return SuccessResponse(
    res,
    {
      message: "Login successful",
      token,
      user: {
        id: admin[0].id,
        name: admin[0].name,
        email: admin[0].email,
        phone: admin[0].phone,
        role: admin[0].role,
        project_id: effectiveProjectId,
        project_name: selectedProject?.name,
        project_logo: selectedProject?.logo,
        project_design: selectedProject?.design,
      },
      project: selectedProject,
    },
    200
  );
}

export async function hash_password(req: Request, res: Response) {
  const { password } = req.body;
  return SuccessResponse(
    res,
    {
      password: await bcrypt.hash(password, 10),
    },
    200
  );
}
