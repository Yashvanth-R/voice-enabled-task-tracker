import { Router } from 'express';
import { parseVoiceCommand, getVoiceHistory } from '../controllers/voiceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/parse', parseVoiceCommand);
router.get('/history', getVoiceHistory);

export default router;
