import { Router } from 'express';
import { getCampaigns } from '../controllers/campaign.controller';

const router = Router();

router.get('/', getCampaigns);

export default router;
