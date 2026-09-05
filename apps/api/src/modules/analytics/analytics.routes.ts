import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import * as analyticsController from './analytics.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/owner-summary', analyticsController.getOwnerSummary);
router.get('/overview', analyticsController.getExecutiveOverview);
router.get('/sales', analyticsController.getSalesReports);
router.get('/inventory', analyticsController.getInventoryReports);
router.get('/purchases', analyticsController.getPurchaseReports);
router.get('/customers', analyticsController.getCustomerAnalytics);
router.get('/suppliers', analyticsController.getSupplierAnalytics);
router.get('/finance', analyticsController.getFinanceReports);
router.get('/expenses', analyticsController.getExpenseReports);
router.get('/production', analyticsController.getProductionReports);
router.get('/export', analyticsController.exportReport);

export default router;
