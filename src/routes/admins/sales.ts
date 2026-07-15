import { Router } from "express";
import {
    getAllSales,
    lists,
    getSalesById,
    createSales,
    updateSales,
    deleteSales, 

} from "../../controllers/admin/sales";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkAdminLeader } from "../../middlewares/checkpermission";

const router = Router(); 
router.get("/",checkAdminLeader(), catchAsync(getAllSales));
router.get("/lists",checkAdminLeader(), catchAsync(lists));
router.get("/:id",checkAdminLeader(), catchAsync(getSalesById));
router.post("/",checkAdminLeader(), catchAsync(createSales));
router.put("/:id",checkAdminLeader(), catchAsync(updateSales));
router.delete("/:id",checkAdminLeader(), catchAsync(deleteSales));
export default router;