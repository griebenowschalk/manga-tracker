import { Router } from 'express';
import { register } from '../controllers/auth';
import { validate } from '../middleware/validation.middleware';
import { registerSchema } from '../validations/auth.validation';

const router: Router = Router();

router.post('/register', validate(registerSchema), register);

export default router;
