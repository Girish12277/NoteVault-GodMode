import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All payment routes require authentication
router.post('/create-order', authenticate, validate(schemas.createOrder), paymentController.createOrder);
router.post('/verify', authenticate, validate(schemas.verifyPayment), paymentController.verifyPayment);
router.get('/transactions', authenticate, paymentController.getTransactions);
// Protocol: Invoice Generation Route
router.get('/invoice/:paymentId', authenticate, paymentController.downloadInvoice);

export default router;
