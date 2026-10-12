import { Router } from "express";
import {
    getAllWishLists,
    lists,
    getWishListsById,
    createWishLists,
    updateWishLists,
    deleteWishLists,
    convertWishListToVisit,
} from "../../controllers/admin/wishlist";
import { catchAsync } from "../../utils/catchAsync";
import { checkOnlyAdmin, checkAdminLeaderSales } from "../../middlewares/checkpermission";

const router = Router();

router.get("/", checkAdminLeaderSales(), catchAsync(getAllWishLists));
router.get("/lists", checkAdminLeaderSales(), catchAsync(lists));
router.post("/:id/convert", checkAdminLeaderSales(), catchAsync(convertWishListToVisit));
router.post("/convert/:id", checkAdminLeaderSales(), catchAsync(convertWishListToVisit));
router.get("/:id", checkAdminLeaderSales(), catchAsync(getWishListsById));
router.post("/", checkAdminLeaderSales(), catchAsync(createWishLists));
router.put("/:id", checkAdminLeaderSales(), catchAsync(updateWishLists));
router.delete("/:id", checkAdminLeaderSales(), catchAsync(deleteWishLists));

export default router;
