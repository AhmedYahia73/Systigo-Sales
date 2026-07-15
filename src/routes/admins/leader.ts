import { Router } from "express";
import {
    getAllLeader,
    lists,
    getLeaderById,
    createLeader,
    updateLeader,
    deleteLeader, 

} from "../../controllers/admin/leader";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";

const router = Router(); 
router.get("/",checkOnlyAdmin(), catchAsync(getAllLeader));
router.get("/lists",checkOnlyAdmin(), catchAsync(lists));
router.get("/:id",checkOnlyAdmin(), catchAsync(getLeaderById));
router.post("/",checkOnlyAdmin(), catchAsync(createLeader));
router.put("/:id",checkOnlyAdmin(), catchAsync(updateLeader));
router.delete("/:id",checkOnlyAdmin(), catchAsync(deleteLeader));
export default router;