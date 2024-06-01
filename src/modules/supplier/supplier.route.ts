import express from 'express';
import { verifySupplier } from '../../utils/jwtHelpers/verifyAuth';
import { supplierController } from './supplier.controller';

const router = express.Router();

router.route('/orders').get(verifySupplier, supplierController.getOrders);
router.route('/teams').get(verifySupplier, supplierController.getTeams);
router
  .route('/delivery-spot')
  .get(verifySupplier, supplierController.getDeliverySpot);

export default { supplierRouter: router };
