import { Router } from 'express';
import multer from 'multer';
import { uploadEmail, getAllEmails, getEmailById, deleteEmail } from '../controllers/email.controller';

const router = Router();

// Store the uploaded file in memory temporarily for parsing, with a strict 5MB size limit to prevent memory exhaustion (DoS protection)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

router.post('/upload', upload.single('file'), uploadEmail);
router.get('/', getAllEmails);
router.get('/:id', getEmailById);
router.delete('/:id', deleteEmail);

export default router;
