import express from 'express';
import { authController } from './auth.controller';
import { verifyAuth } from '../../utils/jwtHelpers/verifyAuth';

const router = express.Router();

router.route('/sign-up').post(authController.signUp);
router.route('/login').post(authController.login);
router
  .route('/change-password')
  .post(verifyAuth, authController.changePassword);

export default { authRouter: router };
