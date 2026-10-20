"use strict";
// src/controllers/auth/authController.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesProjects = getSalesProjects;
exports.getProjectDetails = getProjectDetails;
exports.login = login;
exports.hash_password = hash_password;
const db_1 = require("../../models/db");
const schema_1 = require("../../models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../../utils/auth");
const Errors_1 = require("../../Errors");
const BadRequest_1 = require("../../Errors/BadRequest");
const NotFound_1 = require("../../Errors/NotFound");
const response_1 = require("../../utils/response");
// ✅ Fetch All Sales Projects for Login Selector
async function getSalesProjects(req, res) {
    const allProjects = await db_1.db
        .select({
        id: schema_1.salesProjects.id,
        name: schema_1.salesProjects.name,
        logo: schema_1.salesProjects.logo,
        design: schema_1.salesProjects.design,
    })
        .from(schema_1.salesProjects)
        .orderBy((0, drizzle_orm_1.desc)(schema_1.salesProjects.createdAt));
    return (0, response_1.SuccessResponse)(res, { salesProjects: allProjects }, 200);
}
// ✅ Fetch Project Details By ID
async function getProjectDetails(req, res) {
    const { id } = req.params;
    const [project] = await db_1.db
        .select({
        id: schema_1.salesProjects.id,
        name: schema_1.salesProjects.name,
        logo: schema_1.salesProjects.logo,
        design: schema_1.salesProjects.design,
    })
        .from(schema_1.salesProjects)
        .where((0, drizzle_orm_1.eq)(schema_1.salesProjects.id, id))
        .limit(1);
    if (!project) {
        throw new NotFound_1.NotFound("Sales project not found");
    }
    return (0, response_1.SuccessResponse)(res, { project }, 200);
}
// ✅ User Login with Project Selection & Verification
async function login(req, res) {
    const { email, password, project_id } = req.body;
    // 1) جلب المستخدم بالإيميل
    const admin = await db_1.db
        .select()
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
        .limit(1);
    if (!admin[0]) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    // 2) التحقق من الباسورد
    const match = await bcrypt_1.default.compare(password, admin[0].password);
    if (!match) {
        throw new Errors_1.UnauthorizedError("Invalid email or password");
    }
    // 3) التحقق من حالة الحساب
    if (admin[0].status !== "active") {
        throw new Errors_1.UnauthorizedError("Your account is inactive");
    }
    const userRole = admin[0].role;
    let selectedProject = null;
    // 4) التحقق من المشروع وصلاحيات الوصول إليه
    if (project_id) {
        const [proj] = await db_1.db
            .select({
            id: schema_1.salesProjects.id,
            name: schema_1.salesProjects.name,
            logo: schema_1.salesProjects.logo,
            design: schema_1.salesProjects.design,
        })
            .from(schema_1.salesProjects)
            .where((0, drizzle_orm_1.eq)(schema_1.salesProjects.id, project_id))
            .limit(1);
        if (!proj) {
            throw new BadRequest_1.BadRequest("المشروع المختار غير موجود (Selected sales project not found)");
        }
        selectedProject = proj;
        // التحقق من تعيين المستخدم على هذا المشروع في حال كان sales أو leader
        if (userRole === "sales" || userRole === "leader") {
            const [assigned] = await db_1.db
                .select()
                .from(schema_1.salesProjectUsers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.salesProjectUsers.sales_project_id, project_id), (0, drizzle_orm_1.eq)(schema_1.salesProjectUsers.user_id, admin[0].id)))
                .limit(1);
            if (!assigned) {
                throw new Errors_1.UnauthorizedError("عفواً، لست معيناً على هذا المشروع (You are not assigned to this project)");
            }
        }
    }
    else if (userRole === "sales" || userRole === "leader") {
        // في حال لم يتم إرسال project_id صراحة، نحاول استخراج أول مشروع معين عليه
        const assigned = await db_1.db
            .select({ sales_project_id: schema_1.salesProjectUsers.sales_project_id })
            .from(schema_1.salesProjectUsers)
            .where((0, drizzle_orm_1.eq)(schema_1.salesProjectUsers.user_id, admin[0].id))
            .limit(1);
        if (assigned[0]?.sales_project_id) {
            const [proj] = await db_1.db
                .select({
                id: schema_1.salesProjects.id,
                name: schema_1.salesProjects.name,
                logo: schema_1.salesProjects.logo,
                design: schema_1.salesProjects.design,
            })
                .from(schema_1.salesProjects)
                .where((0, drizzle_orm_1.eq)(schema_1.salesProjects.id, assigned[0].sales_project_id))
                .limit(1);
            if (proj) {
                selectedProject = proj;
            }
        }
    }
    // 5) إعداد بيانات التوكن بما فيها project_id وبيانات الهوية
    const effectiveProjectId = selectedProject ? selectedProject.id : project_id || undefined;
    const tokenPayload = {
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
    const token = (0, auth_1.generateUserToken)(tokenPayload);
    // 6) إرسال الاستجابة الناجحة
    return (0, response_1.SuccessResponse)(res, {
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
    }, 200);
}
async function hash_password(req, res) {
    const { password } = req.body;
    return (0, response_1.SuccessResponse)(res, {
        password: await bcrypt_1.default.hash(password, 10),
    }, 200);
}
