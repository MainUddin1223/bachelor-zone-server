import express from 'express';
import { verifyUser } from '../../utils/jwtHelpers/verifyAuth';
import { userController } from './user.controller';

const router = express.Router();

router.route('/info').get(verifyUser, userController.getUserInfo);
router.route('/team-details').get(verifyUser, userController.getTeamDetails);
router
  .route('/order')
  .post(verifyUser, userController.placeOrder)
  .get(verifyUser, userController.getUpcomingOrder);

router.route('/order-history').get(verifyUser, userController.getOrderHistory);
router.route('/transaction').get(verifyUser, userController.getTransaction);

router
  .route('/order/:id')
  .post(verifyUser, userController.cancelOrder)
  .patch(verifyUser, userController.updateOrder);

export default { authRouter: router };
