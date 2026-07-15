import { Router } from "express";
import {
    getAllWishLists, 
    getWishListsById,
    createWishLists,
    updateWishLists,
    deleteWishLists, 

} from "../../controllers/admin/wishlist";
import { catchAsync } from "../../utils/catchAsync"; 
import { checkOnlyAdmin } from "../../middlewares/checkpermission";

const router = Router(); 
router.get("/",checkOnlyAdmin(), catchAsync(getAllWishLists)); 
router.get("/:id",checkOnlyAdmin(), catchAsync(getWishListsById));
router.post("/",checkOnlyAdmin(), catchAsync(createWishLists));
router.put("/:id",checkOnlyAdmin(), catchAsync(updateWishLists));
router.delete("/:id",checkOnlyAdmin(), catchAsync(deleteWishLists));
export default router;