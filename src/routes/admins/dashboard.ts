import { Router } from "express";
import {
    viewDashboard, 
} from "../../controllers/admin/dashboard";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkAdminLeaderSales } from "../../middlewares/checkpermission";

const router = Router();
 
router.get("/", checkAdminLeaderSales(), catchAsync(viewDashboard));
 
export default router;
