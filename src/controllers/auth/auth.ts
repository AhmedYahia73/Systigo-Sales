// src/controllers/auth/authController.ts

import { Request, Response } from "express";
import { db } from "../../models/db";
import { users } from "../../models/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generateUserToken } from "../../utils/auth";
import { UnauthorizedError } from "../../Errors";
import { SuccessResponse } from "../../utils/response";
import { Permission } from "../../types/custom";
 

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  // 1) جلب الأدمن بالإيميل
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

  // 4) جلب الـ Role والـ Permissions
  let role = null;
  let permissions: Permission[] = [];

  if (admin[0].type === "organizer") {
    // الـ Organizer له كل الصلاحيات
    permissions = [];
  } else if (admin[0].roleId) {
    const roleData = await db
      .select()
      .from(roles)
      .where(eq(roles.id, admin[0].roleId))
      .limit(1);

    if (roleData[0]) {
      role = {
        id: roleData[0].id,
        name: roleData[0].name,
      };
      permissions = parsePermissions(roleData[0].permissions);
    }
  }

  // دمج صلاحيات الـ Admin الإضافية
  const adminPermissions = parsePermissions(admin[0].permissions);
  if (adminPermissions.length > 0) {
    permissions = mergePermissions(permissions, adminPermissions);
  }

  // 5) إنشاء التوكن
  const tokenPayload = {
    id: admin[0].id,
    type: admin[0].type,
    email: admin[0].email,
    name: admin[0].name,
    organizationId: admin[0].organizationId,
  };

  const token =
    admin[0].type === "organizer"
      ? generateOrganizerToken(tokenPayload)
      : generateAdminToken(tokenPayload);

  // 6) الرد
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
        avatar: admin[0].avatar,
        type: admin[0].type,
        organizationId: admin[0].organizationId,
        role,
        permissions,
      },
    },
    200
  );
}
 