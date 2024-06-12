import express from 'express';
import {
  verifyAdminSupplier,
  verifySupplier,
} from '../../utils/jwtHelpers/verifyAuth';
import { supplierController } from './supplier.controller';
import { adminController } from '../admin/controllers/admin.controller';

const router = express.Router();

//get users
router.route('/user').get(verifySupplier, supplierController.getUsers);

//recharge balance
router
  .route('/recharge')
  .post(verifySupplier, supplierController.rechargeBalance);

// get transactions
router
  .route('/transaction')
  .get(verifySupplier, supplierController.getTransactions);

// ----------- deliver apis ------------------

// delivery address

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

// ----------- pickup apis ------------------

// get pickup points
router.route('/pickup').get(verifySupplier, supplierController.getPickupSpot);

// get teams by  address id
router
  .route('/pickup/:id')
  .get(verifySupplier, supplierController.getPickupSpotDetails);

//pickup boxes
router
  .route('/pickup-order/:id')
  .patch(verifyAdminSupplier, adminController.pickupOrder);

export default { supplierRouter: router };
