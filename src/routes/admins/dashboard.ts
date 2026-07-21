import { Router } from "express";
import {
    viewDashboard,
} from "../../controllers/admin/dashboard";
import { catchAsync } from "../../utils/catchAsync";
import { checkAdminLeaderSales } from "../../middlewares/checkpermission";

const router = Router();

router.get("/", checkAdminLeaderSales(), catchAsync(viewDashboard));
router.post("/", checkAdminLeaderSales(), catchAsync(viewDashboard));

export default router;
