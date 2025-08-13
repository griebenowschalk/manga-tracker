import { Router } from 'express';
import { logout, refresh, register } from '../controllers/auth';
import { validateBody } from '../middleware/validation.middleware';
import { registerSchema } from '../validations/auth.validation';

const router: Router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
