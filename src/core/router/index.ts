import express from 'express';
import userRoute from './user.route';
import vendorRoute from './vendor.route';
import warehouseRoute from './warehouse.route';
import salespersonRoute from './salesperson.route';
import productRoute from './product.route';
import categoryRoute from './category.route';
import authRoute from './auth.route';
import statisticsRoute from './statistics.route';
import orderRoute from './order.route';
import uploadRoute from './upload.route';
import { requireAdmin } from '../../middleware/requireAdmin';
import { requireStaff } from '../../middleware/requireStaff';

import { requireAuth } from '../../middleware/requireAuth';
import { requireRoles } from '../../middleware/requireRoles';
import { Role } from '../../types';

const router = express.Router();

router.use("/auth", authRoute);
router.use("/users", requireRoles([Role.ADMIN]), userRoute);
router.use("/vendors", requireAuth(), vendorRoute);
router.use("/warehouses", requireRoles([Role.ADMIN, Role.WAREHOUSE_MANAGER]), warehouseRoute);
router.use("/salespersons", requireRoles([Role.ADMIN, Role.WAREHOUSE_MANAGER]), salespersonRoute)
router.use("/products", requireAuth(), productRoute)
router.use("/categories", requireAuth(), categoryRoute)
router.use("/statistics", requireAuth(), statisticsRoute)
router.use("/orders", requireAuth(), orderRoute)
router.use("/uploads", requireRoles([Role.ADMIN]), uploadRoute)

export default router;