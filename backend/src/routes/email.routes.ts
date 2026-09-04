import { Router } from 'express';
import multer from 'multer';
import { uploadEmail } from '../controllers/email.controller';

const router = Router();

// Store the uploaded file in memory temporarily for parsing
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadEmail);

export default router;
