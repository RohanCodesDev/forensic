import { Router } from 'express';
import { 
  createCase, 
  getAllCases, 
  getCaseById, 
  updateCase, 
  assignEmailToCase, 
  getAuditLogs 
} from '../controllers/case.controller';

const router = Router();

// Case CRUD
router.post('/', createCase);
router.get('/', getAllCases);
router.get('/:id', getCaseById);
router.put('/:id', updateCase);

// Case operations
router.post('/:id/emails', assignEmailToCase);
router.get('/:id/audit', getAuditLogs);

export default router;
