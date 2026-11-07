import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPaymentSchema } from '../validators/payment.validator.js';

const router = Router();

router.get('/config', requireAuth, paymentController.getConfig);
router.post('/topup', requireAuth, validate(createPaymentSchema), paymentController.createTopUp);
router.post('/midtrans/notification', paymentController.handleMidtransNotification);
router.get('/:orderId', requireAuth, paymentController.getPayment);

export default router;
