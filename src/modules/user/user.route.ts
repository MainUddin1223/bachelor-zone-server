import express from 'express';
import { verifyAuth } from '../../utils/jwtHelpers/verifyAuth';
import { userController } from './user.controller';

const router = express.Router();

router.route('/place-order').post(verifyAuth, userController.placeOrder);

export default { authRouter: router };
