import { Router } from 'express';
import authRoutes from './auth.routes.js';
import recipientRoutes from './recipient.routes.js';
import walletRoutes from './wallet.routes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK' });
});

router.use('/auth', authRoutes);
router.use('/recipients', recipientRoutes);
router.use('/', walletRoutes);

export default router;
