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

const router = express.Router();

router.use("/auth", authRoute);
router.use("/users", requireAdmin(), userRoute);
router.use("/vendors", vendorRoute);
router.use("/warehouses", requireAdmin(), warehouseRoute);
router.use("/salespersons", requireAdmin(), salespersonRoute)
router.use("/products", productRoute)
router.use("/categories", requireAdmin(), categoryRoute)
router.use("/statistics", statisticsRoute)
router.use("/orders", orderRoute)
router.use("/uploads", requireAdmin(), uploadRoute)

export default router;