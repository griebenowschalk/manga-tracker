import { Router } from 'express';
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from '../controllers/users';
import { paginatedResults } from '../middleware/async.middleware';
import { Role } from '@prisma/client';
import { protect, authorize } from '../middleware/auth.middleware';
import { getUserSelect } from '../utils/auth';
import {
  createUserSchema,
  updateUserSchema,
} from '../validations/user.validation';
import { validateBody } from '../middleware/validation.middleware';

const router: Router = Router();

router.use(protect, authorize(Role.ADMIN));

router
  .route('/')
  .get(
    paginatedResults('user', {
      select: getUserSelect(),
    }),
    getUsers
  )
  .post(validateBody(createUserSchema), createUser);

router
  .route('/:id')
  .get(getUser)
  .put(validateBody(updateUserSchema), updateUser)
  .delete(deleteUser);

export default router;
