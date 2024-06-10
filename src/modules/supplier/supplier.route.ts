import express from 'express';
import {
  verifyAdminSupplier,
  verifySupplier,
} from '../../utils/jwtHelpers/verifyAuth';
import { supplierController } from './supplier.controller';
import { adminController } from '../admin/controllers/admin.controller';

const router = express.Router();
//get users
router.route('/users').get(verifySupplier, supplierController.getUsers);

// delivery

router
  .route('/delivery-address')
  .get(verifySupplier, supplierController.getDeliverySpot);

// get delivery by id
router
  .route('/delivery-address/:id')
  .get(verifySupplier, supplierController.getDeliverySpotDetails);

// deliver order

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
  .route('/deliver-order/:id')
  .get(verifyAdminSupplier, adminController.deliverOrder);
//
router.route('/pickup').get(verifySupplier, supplierController.getPickupSpot);
router
  .route('/pickup/:id')
  .get(verifySupplier, supplierController.getPickupSpotDetails);

router
  .route('/pickup-order/:id')
  .patch(verifyAdminSupplier, adminController.pickupOrder);

export default { supplierRouter: router };
