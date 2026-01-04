import express from 'express';
import userRoute from './user.route';
import vendorRoute from './vendor.route';
import warehouseRoute from './warehouse.route';
import salespersonRoute from './salesperson.route';

const router = express.Router();

router.use("/users", userRoute);
router.use("/vendors", vendorRoute);
router.use("/warehouses", warehouseRoute);
router.use("/salespersons", salespersonRoute);

export default router;