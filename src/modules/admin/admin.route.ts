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

export default { adminRouter: router };
