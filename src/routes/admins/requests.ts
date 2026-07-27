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
 
 * @swagger
 * /api/admin/admins:
 *   get:
 *     summary: Get all admins
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admins
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 admins:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/pending", checkAdminLeader(), catchAsync(getPendingRequest));
router.get("/history", checkAdminLeader(), catchAsync(getHistoryRequest));
router.put("/status/:id", checkAdminLeader(), catchAsync(changeStatus));

export default router;
