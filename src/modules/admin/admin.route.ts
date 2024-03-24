import express from 'express';
import { verifyAdmin } from '../../utils/jwtHelpers/verifyAuth';
import { adminController } from './admin.controller';

const router = express.Router();

router
  .route('/address')
  .post(verifyAdmin, adminController.addAddress)
  .patch(verifyAdmin, adminController.updateAddress);

export default { adminRouter: router };
