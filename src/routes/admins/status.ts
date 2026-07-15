import { Router } from "express";
import {
    getAllVisitStatuss, 
    getVisitStatussById,
    createVisitStatuss,
    updateVisitStatuss,
    deleteVisitStatuss, 

} from "../../controllers/admin/status";
import { catchAsync } from "../../utils/catchAsync"; 
import { checkOnlyAdmin } from "../../middlewares/checkpermission";

const router = Router(); 
router.get("/",checkOnlyAdmin(), catchAsync(getAllVisitStatuss)); 
router.get("/:id",checkOnlyAdmin(), catchAsync(getVisitStatussById));
router.post("/",checkOnlyAdmin(), catchAsync(createVisitStatuss));
router.put("/:id",checkOnlyAdmin(), catchAsync(updateVisitStatuss));
router.delete("/:id",checkOnlyAdmin(), catchAsync(deleteVisitStatuss));
export default router;