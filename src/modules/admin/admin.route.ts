import express from 'express';
import { verifyAdmin } from '../../utils/jwtHelpers/verifyAuth';
import { adminController } from './admin.controller';

const router = express.Router();

router
  .route('/address')
  .post(verifyAdmin, adminController.addAddress)
  .patch(verifyAdmin, adminController.updateAddress);
router.route('/team').post(verifyAdmin, adminController.createTeam);
router.route('/claim-user').post(verifyAdmin, adminController.claimUser);
router.route('/change-team').post(verifyAdmin, adminController.changeTeam);
router.route('/recharge').post(verifyAdmin, adminController.rechargeBalance);
router.route('/refund').post(verifyAdmin, adminController.refundBalance);
router.route('/expense').post(verifyAdmin, adminController.listExpenses);
router.route('/change-leader').post(verifyAdmin, adminController.changeLeader);
router.route('/orders').get(verifyAdmin, adminController.getOrders);
router.route('/orders/:id').patch(verifyAdmin, adminController.deliverOrder);
router.route('/user-info').patch(verifyAdmin, adminController.getUserInfo);

export default { adminRouter: router };
