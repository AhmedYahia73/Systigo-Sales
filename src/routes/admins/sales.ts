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
import { checkOnlyAdmin } from "../../middlewares/checkpermission";

const router = Router(); 
router.get("/",checkOnlyAdmin(), catchAsync(getAllSales));
router.get("/lists",checkOnlyAdmin(), catchAsync(lists));
router.get("/:id",checkOnlyAdmin(), catchAsync(getSalesById));
router.post("/",checkOnlyAdmin(), catchAsync(createSales));
router.put("/:id",checkOnlyAdmin(), catchAsync(updateSales));
router.delete("/:id",checkOnlyAdmin(), catchAsync(deleteSales));
export default router;