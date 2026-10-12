import { Router } from "express";
import { login, hash_password } from "../../controllers/auth/auth";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { loginSchema, hashPasswordSchema } from "../../validators/auth";

const route = Router();

route.post("/login", validate(loginSchema), catchAsync(login));
route.post("/hash_password", validate(hashPasswordSchema), catchAsync(hash_password));

export default route;
