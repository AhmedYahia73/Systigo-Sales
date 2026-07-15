import { Router } from "express";
import {
    getAllLeader,
    lists,
    getLeaderById,
    createLeader,
    updateLeader,
    deleteLeader,
} from "../../controllers/admin/leader";
import { catchAsync } from "../../utils/catchAsync";
import { validate } from "../../middlewares/validation";
import { checkOnlyAdmin } from "../../middlewares/checkpermission";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Leaders
 *   description: Leader management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Leader:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         image:
 *           type: string
 *           nullable: true
 *         target:
 *           type: string
 *           nullable: true
 *         target_number:
 *           type: number
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *     CreateLeaderBody:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - password
 *         - status
 *       properties:
 *         name:
 *           type: string
 *           example: Ahmed Ali
 *         email:
 *           type: string
 *           format: email
 *           example: ahmed@example.com
 *         phone:
 *           type: string
 *           example: "01012345678"
 *         password:
 *           type: string
 *           example: secret123
 *         image:
 *           type: string
 *           nullable: true
 *           description: Base64 encoded image string
 *         target_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *     UpdateLeaderBody:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         password:
 *           type: string
 *         image:
 *           type: string
 *           nullable: true
 *           description: Base64 encoded image string
 *         target_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *     TargetListItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 */

/**
 * @swagger
 * /api/admin/leader:
 *   get:
 *     summary: Get all leaders
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leaders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leaders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Leader'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", checkOnlyAdmin(), catchAsync(getAllLeader));

/**
 * @swagger
 * /api/admin/leader/lists:
 *   get:
 *     summary: Get targets dropdown list
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of targets for dropdown selection
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 target_list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TargetListItem'
 *       401:
 *         description: Unauthorized
 */
router.get("/lists", checkOnlyAdmin(), catchAsync(lists));

/**
 * @swagger
 * /api/admin/leader/{id}:
 *   get:
 *     summary: Get leader by ID
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leader UUID
 *     responses:
 *       200:
 *         description: Leader data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 leader:
 *                   $ref: '#/components/schemas/Leader'
 *       404:
 *         description: Leader not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", checkOnlyAdmin(), catchAsync(getLeaderById));

/**
 * @swagger
 * /api/admin/leader:
 *   post:
 *     summary: Create a new leader
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLeaderBody'
 *     responses:
 *       201:
 *         description: Leader created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leader created successfully
 *       400:
 *         description: Email or Phone already exists
 *       401:
 *         description: Unauthorized
 */
router.post("/", checkOnlyAdmin(), catchAsync(createLeader));

/**
 * @swagger
 * /api/admin/leader/{id}:
 *   put:
 *     summary: Update leader by ID
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leader UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLeaderBody'
 *     responses:
 *       200:
 *         description: Leader updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leader updated successfully
 *       400:
 *         description: Email or Phone already exists
 *       404:
 *         description: Leader not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", checkOnlyAdmin(), catchAsync(updateLeader));

/**
 * @swagger
 * /api/admin/leader/{id}:
 *   delete:
 *     summary: Delete leader by ID
 *     tags: [Leaders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Leader UUID
 *     responses:
 *       200:
 *         description: Leader deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Leader deleted successfully
 *       404:
 *         description: Leader not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", checkOnlyAdmin(), catchAsync(deleteLeader));

export default router;
