import { Router } from 'express';
import {
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  register,
  resetPassword,
  updatePassword,
  updateDetails,
} from '../controllers/auth';
import { validateBody } from '../middleware/validation.middleware';
import {
  loginSchema,
  registerSchema,
  updateUserDetailsSchema,
} from '../validations/auth.validation';
import { protect, requireCsrf } from '../middleware/auth.middleware';

const router: Router = Router();

router.use(requireCsrf);

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/update-password', protect, updatePassword);
router.put(
  '/update-details',
  protect,
  validateBody(updateUserDetailsSchema),
  updateDetails
);

export default router;
