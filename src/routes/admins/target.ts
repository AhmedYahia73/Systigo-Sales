import { Router } from "express";
import {
    getAllTargets, 
    getTargetsById,
    createTargets,
    updateTargets,
    deleteTargets, 

} from "../../controllers/admin/target";
import { catchAsync } from "../../utils/catchAsync"; 
import { checkOnlyAdmin } from "../../middlewares/checkpermission";

const router = Router(); 
router.get("/",checkOnlyAdmin(), catchAsync(getAllTargets)); 
router.get("/:id",checkOnlyAdmin(), catchAsync(getTargetsById));
router.post("/",checkOnlyAdmin(), catchAsync(createTargets));
router.put("/:id",checkOnlyAdmin(), catchAsync(updateTargets));
router.delete("/:id",checkOnlyAdmin(), catchAsync(deleteTargets));
export default router;