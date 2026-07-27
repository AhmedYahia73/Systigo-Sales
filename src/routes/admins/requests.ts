import { Router } from "express";
import { 
    getPendingRequest,
    getHistoryRequest,
    changeStatus
} from "../../controllers/admin/statusRequests";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkAdminLeader } from "../../middlewares/checkpermission";

const router = Router();

router.get("/pending", checkAdminLeader(), catchAsync(getPendingRequest));
router.get("/history", checkAdminLeader(), catchAsync(getHistoryRequest));
router.put("/status/:id", checkAdminLeader(), catchAsync(changeStatus));

export default router;
