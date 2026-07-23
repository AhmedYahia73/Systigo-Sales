import { Router } from "express";
import {
    getAllWishLists,
    getWishListsById,
    createWishLists,
    updateWishLists,
    deleteWishLists,
} from "../../controllers/admin/wishlist";
import { catchAsync } from "../../utils/catchAsync";
import { checkOnlyAdmin, checkAdminLeaderSales } from "../../middlewares/checkpermission";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wish List
 *   description: Wish list management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     WishList:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *     CreateWishListBody:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Premium Products
 *         description:
 *           type: string
 *           nullable: true
 *           example: High-value product wishlist
 *     UpdateWishListBody:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /api/admin/wish_list:
 *   get:
 *     summary: Get all wish lists
 *     tags: [Wish List]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all wish lists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allWishLists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WishList'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/", checkAdminLeaderSales(), catchAsync(getAllWishLists));

/**
 * @swagger
 * /api/admin/wish_list/{id}:
 *   get:
 *     summary: Get wish list by ID
 *     tags: [Wish List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wish list UUID
 *     responses:
 *       200:
 *         description: Wish list data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 WishList:
 *                   $ref: '#/components/schemas/WishList'
 *       404:
 *         description: Wish list not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", checkOnlyAdmin(), catchAsync(getWishListsById));

/**
 * @swagger
 * /api/admin/wish_list:
 *   post:
 *     summary: Create a new wish list
 *     tags: [Wish List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWishListBody'
 *     responses:
 *       201:
 *         description: Wish list created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: WishList created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", checkOnlyAdmin(), catchAsync(createWishLists));

/**
 * @swagger
 * /api/admin/wish_list/{id}:
 *   put:
 *     summary: Update wish list by ID
 *     tags: [Wish List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wish list UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWishListBody'
 *     responses:
 *       200:
 *         description: Wish list updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: WishList updated successfully
 *       404:
 *         description: Wish list not found
 *       401:
 *         description: Unauthorized
 */
router.put("/:id", checkOnlyAdmin(), catchAsync(updateWishLists));

/**
 * @swagger
 * /api/admin/wish_list/{id}:
 *   delete:
 *     summary: Delete wish list by ID
 *     tags: [Wish List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Wish list UUID
 *     responses:
 *       200:
 *         description: Wish list deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: WishList deleted successfully
 *       404:
 *         description: Wish list not found
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id", checkOnlyAdmin(), catchAsync(deleteWishLists));

export default router;
