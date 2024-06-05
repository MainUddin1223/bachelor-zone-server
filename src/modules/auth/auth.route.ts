import express from 'express';
import { authController } from './auth.controller';
import { verifyAdmin, verifyAuth } from '../../utils/jwtHelpers/verifyAuth';

const router = express.Router();

router.route('/sign-up').post(authController.signUp);
router.route('/login').post(authController.login);
router.route('/admin-login').post(authController.adminLogin);
router
  .route('/change-password')
  .post(verifyAuth, authController.changePassword);
router
  .route('/admin-change-password')
  .post(verifyAdmin, authController.changePasswordByAdmin);

export default { authRouter: router };
