import { Router } from "express";
import {
    getAllVisits,
    lists,
    getVisitsById,
    createVisits,
    updateVisits,
    deleteVisits,
    getAllSales,
    getVisitsCounts
} from "../../controllers/admin/visits";
import { catchAsync } from "../../utils/catchAsync";
import { checkAdminLeaderSales } from "../../middlewares/checkpermission";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Visits
 *   description: Visit management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Visit:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         lat:
 *           type: number
 *           example: 30.0444
 *         lng:
 *           type: number
 *           example: 31.2357
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         notes:
 *           type: string
 *           nullable: true
 *         phone:
 *           type: string
 *         status:
 *           type: string
 *           enum: [visit, sales, delivered]
 *         visit_status:
 *           type: string
 *           nullable: true
 *         status_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         sales:
 *           type: string
 *           nullable: true
 *         sales_phone:
 *           type: string
 *           nullable: true
 *         map_link:
 *           type: string
 *           example: "https://www.google.com/maps/search/?api=1&query=30.0444,31.2357"
 *     CreateVisitBody:
 *       type: object
 *       required:
 *         - lat
 *         - lng
 *         - name
 *         - address
 *         - phone
 *         - sales_id
 *       properties:
 *         lat:
 *           type: number
 *           example: 30.0444
 *         lng:
 *           type: number
 *           example: 31.2357
 *         name:
 *           type: string
 *           example: Cairo Client
 *         address:
 *           type: string
 *           example: 12 Tahrir Square, Cairo
 *         notes:
 *           type: string
 *           nullable: true
 *           example: Call before visiting
 *         phone:
 *           type: string
 *           example: "01012345678"
 *         status:
 *           type: string
 *           enum: [visit, sales, delivered]
 *           default: visit
 *         status_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         sales_id:
 *           type: string
 *           format: uuid
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *     UpdateVisitBody:
 *       type: object
 *       properties:
 *         lat:
 *           type: number
 *         lng:
 *           type: number
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         notes:
 *           type: string
 *           nullable: true
 *         phone:
 *           type: string
 *         status:
 *           type: string
 *           enum: [visit, sales, delivered]
 *         status_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         sales_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *     GetVisitsBySalesBody:
 *       type: object
 *       required:
 *         - sales_id
 *       properties:
 *         sales_id:
 *           type: string
 *           format: uuid
 *           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 */

/**
 * @swagger
 * /api/admin/visits:
 *   get:
 *     summary: Get all visits filtered by sales_id
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GetVisitsBySalesBody'
 *     responses:
 *       200:
 *         description: List of visits with map links
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allVisits:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Visit'
 *       400:
 *         description: Invalid sales_id
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", checkAdminLeaderSales(), catchAsync(getAllVisits));
router.get("/sales", checkAdminLeaderSales(), catchAsync(getAllSales));
router.get("/report", checkAdminLeaderSales(), catchAsync(getVisitsCounts));

/**
 * @swagger
 * /api/admin/visits/lists:
 *   get:
 *     summary: Get active visit statuses dropdown list
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active visit statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 visit_status:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/lists", checkAdminLeaderSales(), catchAsync(lists));

/**
 * @swagger
 * /api/admin/visits/{id}:
 *   get:
 *     summary: Get visit by ID
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Visit UUID
 *     responses:
 *       200:
 *         description: Visit data with map link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Visit:
 *                   $ref: '#/components/schemas/Visit'
 *       404:
 *         description: Visit not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", checkAdminLeaderSales(), catchAsync(getVisitsById));

/**
 * @swagger
 * /api/admin/visits:
 *   post:
 *     summary: Create a new visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVisitBody'
 *     responses:
 *       201:
 *         description: Visit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Visit created successfully
 *       400:
 *         description: Invalid sales_id or status_id
 *       401:
 *         description: Unauthorized
 */
router.post("/", checkAdminLeaderSales(), catchAsync(createVisits));

/**
 * @swagger
 * /api/admin/visits/{id}:
 *   put:
 *     summary: Update visit by ID
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Visit UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVisitBody'
 *     responses:
 *       200:
 *         description: Visit updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Visit updated successfully
 *       400:
 *         description: Invalid sales_id or status_id
 *       404:
 *         description: Visit not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", checkAdminLeaderSales(), catchAsync(updateVisits));

/**
 * @swagger
 * /api/admin/visits/{id}:
 *   delete:
 *     summary: Delete visit by ID
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Visit UUID
 *     responses:
 *       200:
 *         description: Visit deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Visit deleted successfully
 *       404:
 *         description: Visit not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", checkAdminLeaderSales(), catchAsync(deleteVisits));

export default router;
