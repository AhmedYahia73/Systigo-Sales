import { Router } from "express";
import { login, hash_password, getSalesProjects, getProjectDetails } from "../../controllers/auth/auth";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { loginSchema, hashPasswordSchema } from "../../validators/auth";

const route = Router();

route.get("/sales-projects", catchAsync(getSalesProjects));
route.get("/sales-projects/:id", catchAsync(getProjectDetails));
route.post("/login", validate(loginSchema), catchAsync(login));
route.post("/hash_password", validate(hashPasswordSchema), catchAsync(hash_password));

export default route;
