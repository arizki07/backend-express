// src/routes/route.ts
import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { autoAudit } from '../middleware/audit.middleware';

import {
  loginController,
  refreshController,
  logoutController,
  meController,
} from '../controllers/auth.controller';
import {
  getUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  updatePasswordController,
  deleteUserController,
  exportUsersController,
} from '../controllers/user.controller';

import { loginSchema } from '../validators/auth.validator';
import {
  createUserSchema,
  updateUserSchema,
  updatePasswordSchema,
} from '../validators/user.validator';
import { getAudits } from '../controllers/audit.controller';

const router = Router();
router.use(autoAudit());

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           minLength: 4
 *           maxLength: 100
 *         password:
 *           type: string
 *           minLength: 8
 *           maxLength: 100
 *     LoginResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             token:
 *               type: string
 *               description: JWT access token
 *             user:
 *               type: object
 *               description: Data lengkap user tanpa password
 *             expiredAt:
 *               type: string
 *               format: date-time
 *     UserCreate:
 *       type: object
 *       required:
 *         - name
 *         - username
 *         - password
 *         - confirm_password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           minLength: 4
 *           maxLength: 100
 *         username:
 *           type: string
 *           minLength: 4
 *           maxLength: 100
 *         password:
 *           type: string
 *           minLength: 8
 *           maxLength: 100
 *         confirm_password:
 *           type: string
 *           minLength: 8
 *           maxLength: 100
 *         role:
 *           type: string
 *           enum: [admin, user]
 *     UserUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         username:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, user]
 *     UpdatePassword:
 *       type: object
 *       required:
 *         - password
 *         - confirm_password
 *       properties:
 *         password:
 *           type: string
 *           minLength: 8
 *           maxLength: 100
 *         confirm_password:
 *           type: string
 *           minLength: 8
 *           maxLength: 100
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 token: "jwt-access-token"
 *                 user:
 *                   id: 1
 *                   username: "admin"
 *                   name: "Admin User"
 *                   role: "admin"
 *                 expiredAt: "2025-09-12T10:00:00Z"
 *       401:
 *         description: Username atau password salah
 */
router.post('/auth/login', validate(loginSchema), loginController);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token yang tersimpan di Redis
 *     responses:
 *       200:
 *         description: Token diperbarui
 *         content:
 *           application/json:
 *             example:
 *               token: "new-jwt-access-token"
 */
router.post('/auth/refresh', refreshController);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Ambil data user yang sedang login
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data user berhasil diambil
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 id: 1
 *                 name: "Admin User"
 *                 username: "admin"
 *                 role: "admin"
 *                 created_by: 0
 *                 updated_by: 0
 *                 created_at: "2025-09-12T08:00:00Z"
 *                 updated_at: "2025-09-12T09:00:00Z"
 *                 deleted_at: null
 *       401:
 *         description: Token tidak valid atau user tidak ditemukan
 */
router.get('/auth/me', authenticate, meController);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout berhasil, refresh token dihapus
 */
router.post('/auth/logout', authenticate, logoutController);

/**
 * @openapi
 * /users/export:
 *   get:
 *     tags: [Users]
 *     summary: Export data user ke CSV
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File CSV berhasil diunduh
 */
router.get('/users/export', authenticate, authorize(['admin']), exportUsersController);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Ambil semua user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Filter nama/username
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin,user]
 *         description: Filter role
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field untuk sorting
 *       - in: query
 *         name: sortDir
 *         schema:
 *           type: string
 *           enum: [asc,desc]
 *         description: Arah sorting
 *     responses:
 *       200:
 *         description: Daftar user dengan metadata pagination
 */
router.get('/users', authenticate, authorize(['admin']), getUsersController);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Ambil user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     responses:
 *       200:
 *         description: Data user
 *       404:
 *         description: User tidak ditemukan
 */
router.get('/users/:id', authenticate, authorize(['admin']), getUserByIdController);

/**
 * @openapi
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Buat user baru
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       201:
 *         description: User berhasil dibuat
 *       400:
 *         description: Validasi input gagal
 */
router.post(
  '/users',
  authenticate,
  authorize(['admin']),
  validate(createUserSchema),
  createUserController,
);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: User berhasil diupdate
 *       404:
 *         description: User tidak ditemukan
 */
router.put(
  '/users/:id',
  authenticate,
  authorize(['user', 'admin']),
  validate(updateUserSchema),
  updateUserController,
);

/**
 * @openapi
 * /users/{id}/password:
 *   put:
 *     tags: [Users]
 *     summary: Update password user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePassword'
 *     responses:
 *       200:
 *         description: Password berhasil diupdate
 *       400:
 *         description: Password confirmation tidak cocok
 */
router.put(
  '/users/:id/password',
  authenticate,
  authorize(['admin']),
  validate(updatePasswordSchema),
  updatePasswordController,
);

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Hapus user (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirm_password]
 *             properties:
 *               confirm_password:
 *                 type: string
 *                 description: Password admin untuk konfirmasi
 *     responses:
 *       200:
 *         description: User berhasil dihapus (soft delete)
 *       400:
 *         description: Password konfirmasi salah
 */
router.delete('/users/:id', authenticate, authorize(['admin']), deleteUserController);

/**
 * @openapi
 * /audits:
 *   get:
 *     tags: [Audits]
 *     summary: Ambil daftar audit logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Nomor halaman
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah data per halaman
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Filter berdasarkan entity
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at]
 *           default: created_at
 *         description: Kolom untuk sorting
 *       - in: query
 *         name: sortDir
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Arah sorting
 *       - in: query
 *         name: createdFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter mulai dari tanggal (YYYY-MM-DD)
 *       - in: query
 *         name: createdTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sampai tanggal (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Daftar audit logs berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalData:
 *                       type: integer
 *                     totalPage:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     perPage:
 *                       type: integer
 */
router.get('/audits', authenticate, authorize(['admin']), getAudits);

export default router;
