"use strict";
// src/middlewares/checkPermission.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOnlyAdmin = exports.checkAdminLeaderSales = exports.checkAdminLeader = void 0;
const Errors_1 = require("../Errors");
// ===================== ADMIN PERMISSIONS =====================
// ✅ Middleware للتحقق من صلاحيات Admin/Leader
const checkAdminLeader = () => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw new Errors_1.UnauthorizedError("Authentication required");
            }
            if (user.role === "admin" || user.role === "leader") {
                return next();
            }
            throw new Errors_1.ForbiddenError("You Must Login as Admin or Leader");
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkAdminLeader = checkAdminLeader;
// ✅ Middleware للتحقق من صلاحيات Admin/Leader
const checkAdminLeaderSales = () => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw new Errors_1.UnauthorizedError("Authentication required");
            }
            if (user.role === "admin" || user.role === "leader" || user.role === "sales") {
                return next();
            }
            throw new Errors_1.ForbiddenError("You Must Login as Admin or Leader or Sales");
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkAdminLeaderSales = checkAdminLeaderSales;
// ✅ Middleware للتحقق من صلاحيات Admin
const checkOnlyAdmin = () => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                throw new Errors_1.UnauthorizedError("Authentication required");
            }
            if (user.role === "admin") {
                return next();
            }
            throw new Errors_1.ForbiddenError("You Must Login as Admin");
        }
        catch (error) {
            next(error);
        }
    };
};
exports.checkOnlyAdmin = checkOnlyAdmin;
