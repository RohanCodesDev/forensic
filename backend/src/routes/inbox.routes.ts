import { Router } from 'express';
import { InboxController } from '../controllers/inbox.controller';

const router = Router();

router.post('/scan', InboxController.scanInbox);

export default router;
