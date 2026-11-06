import { Router } from 'express';
import * as walletController from '../controllers/wallet.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  topUpSchema,
  transactionQuerySchema,
  transferSchema,
} from '../validators/wallet.validator.js';

const router = Router();

router.get('/wallet', requireAuth, walletController.getWallet);
router.get('/wallet/summary', requireAuth, walletController.getSummary);
router.post('/topup', requireAuth, validate(topUpSchema), walletController.topUp);
router.post('/transfer', requireAuth, validate(transferSchema), walletController.transfer);
router.get(
  '/transactions',
  requireAuth,
  validate(transactionQuerySchema, 'query'),
  walletController.listTransactions,
);

export default router;
