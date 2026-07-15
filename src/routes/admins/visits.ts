import { Router } from "express";
import {
    getAllVisits, 
    lists,
    getVisitsById,
    createVisits,
    updateVisits, 
    deleteVisits, 

} from "../../controllers/admin/visits";
import { catchAsync } from "../../utils/catchAsync"; 
import { checkAdminLeaderSales } from "../../middlewares/checkpermission";

const router = Router(); 
router.get("/",checkAdminLeaderSales(), catchAsync(getAllVisits)); 
router.get("/lists",checkAdminLeaderSales(), catchAsync(lists)); 
router.get("/:id",checkAdminLeaderSales(), catchAsync(getVisitsById));
router.post("/",checkAdminLeaderSales(), catchAsync(createVisits));
router.put("/:id",checkAdminLeaderSales(), catchAsync(updateVisits));
router.delete("/:id",checkAdminLeaderSales(), catchAsync(deleteVisits));
export default router;