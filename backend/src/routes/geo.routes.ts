import { Router } from 'express';
import { getGeoThreats } from '../controllers/geo.controller';

const router = Router();

router.get('/threats', getGeoThreats);

export default router;
