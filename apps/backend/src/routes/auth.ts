import { Router } from 'express';
import { getMe, login, logout, refresh, register } from '../controllers/auth';
import { validateBody } from '../middleware/validation.middleware';
import { loginSchema, registerSchema } from '../validations/auth.validation';
import { protect, requireCsrf } from '../middleware/auth.middleware';

const router: Router = Router();

router.use(requireCsrf);

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
