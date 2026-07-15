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

/**
 * @swagger
 * tags:
 *   name: Visit Status
 *   description: Visit status management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     VisitStatus:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         status:
 *           type: boolean
 *           description: Whether this status is active or not
 *     CreateVisitStatusBody:
 *       type: object
 *       required:
 *         - name
 *         - status
 *       properties:
 *         name:
 *           type: string
 *           example: In Progress
 *         status:
 *           type: boolean
 *           example: true
 *     UpdateVisitStatusBody:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         status:
 *           type: boolean
 */

/**
 * @swagger
 * /api/admin/visit_status:
 *   get:
 *     summary: Get all visit statuses
 *     tags: [Visit Status]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all visit statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allVisitStatuss:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VisitStatus'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", checkOnlyAdmin(), catchAsync(getAllVisitStatuss));

/**
 * @swagger
 * /api/admin/visit_status/{id}:
 *   get:
 *     summary: Get visit status by ID
 *     tags: [Visit Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit status ID
 *     responses:
 *       200:
 *         description: Visit status data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 VisitStatuss:
 *                   $ref: '#/components/schemas/VisitStatus'
 *       404:
 *         description: Visit status not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", checkOnlyAdmin(), catchAsync(getVisitStatussById));

/**
 * @swagger
 * /api/admin/visit_status:
 *   post:
 *     summary: Create a new visit status
 *     tags: [Visit Status]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVisitStatusBody'
 *     responses:
 *       201:
 *         description: Visit status created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: VisitStatuss created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", checkOnlyAdmin(), catchAsync(createVisitStatuss));

/**
 * @swagger
 * /api/admin/visit_status/{id}:
 *   put:
 *     summary: Update visit status by ID
 *     tags: [Visit Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit status ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVisitStatusBody'
 *     responses:
 *       200:
 *         description: Visit status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: VisitStatuss updated successfully
 *       404:
 *         description: Visit status not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", checkOnlyAdmin(), catchAsync(updateVisitStatuss));

/**
 * @swagger
 * /api/admin/visit_status/{id}:
 *   delete:
 *     summary: Delete visit status by ID
 *     tags: [Visit Status]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visit status ID
 *     responses:
 *       200:
 *         description: Visit status deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: VisitStatuss deleted successfully
 *       404:
 *         description: Visit status not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", checkOnlyAdmin(), catchAsync(deleteVisitStatuss));

export default router;
