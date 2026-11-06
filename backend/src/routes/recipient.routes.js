import { Router } from 'express';
import * as recipientController from '../controllers/recipient.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { recipientLookupRateLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { addRecipientSchema, recipientIdParamSchema } from '../validators/recipient.validator.js';

const router = Router();

router.use(requireAuth);

router.get('/', recipientController.listRecipients);
router.post(
  '/',
  recipientLookupRateLimiter,
  validate(addRecipientSchema),
  recipientController.addRecipient,
);
router.delete('/:id', validate(recipientIdParamSchema, 'params'), recipientController.removeRecipient);

export default router;
