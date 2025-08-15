import { Router } from 'express';
import { getUsers } from '../controllers/users';
import { paginatedResults } from '../middleware/async.middleware';
import { Role } from '@prisma/client';
import { protect, authorize } from '../middleware/auth.middleware';
import { getUserSelect } from '../utils/auth';

const router: Router = Router();

router.use(protect, authorize(Role.ADMIN));

router.route('/').get(
  paginatedResults('user', {
    select: getUserSelect(),
  }),
  getUsers
);

export default router;
