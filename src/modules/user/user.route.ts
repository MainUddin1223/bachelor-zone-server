import express from 'express';
import { verifyUser } from '../../utils/jwtHelpers/verifyAuth';
import { userController } from './user.controller';

const router = express.Router();

router.route('/order').post(verifyUser, userController.placeOrder);

router.route('/order/:id').post(verifyUser, userController.cancelOrder);

export default { authRouter: router };
