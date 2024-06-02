import express from 'express';
import { verifySupplier } from '../../utils/jwtHelpers/verifyAuth';
import { supplierController } from './supplier.controller';

const router = express.Router();

router.route('/users').get(verifySupplier, supplierController.getUsers);
router
  .route('/deliver/:id')
  .post(verifySupplier, supplierController.deliverOrder);
router.route('/pick-up/:id').post(verifySupplier, supplierController.pickBoxes);
router.route('/teams').get(verifySupplier, supplierController.getTeams);
router
  .route('/transaction')
  .get(verifySupplier, supplierController.getTransactions);
router
  .route('/recharge')
  .post(verifySupplier, supplierController.rechargeBalance);
router
  .route('/delivery-spot/:type')
  .get(verifySupplier, supplierController.getDeliverySpot);

export default { supplierRouter: router };
