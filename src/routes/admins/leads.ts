import { Router } from "express";
import {
  getAllLeads,
  lists,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToVisit,
} from "../../controllers/admin/leads";
import { catchAsync } from "../../utils/catchAsync";
import { checkAdminLeaderSales } from "../../middlewares/checkpermission";

const router = Router();

router.get("/", checkAdminLeaderSales(), catchAsync(getAllLeads));
router.get("/lists", checkAdminLeaderSales(), catchAsync(lists));
router.post("/:id/convert", checkAdminLeaderSales(), catchAsync(convertLeadToVisit));
router.post("/convert/:id", checkAdminLeaderSales(), catchAsync(convertLeadToVisit));
router.get("/:id", checkAdminLeaderSales(), catchAsync(getLeadById));
router.post("/", checkAdminLeaderSales(), catchAsync(createLead));
router.put("/:id", checkAdminLeaderSales(), catchAsync(updateLead));
router.delete("/:id", checkAdminLeaderSales(), catchAsync(deleteLead));

export default router;
