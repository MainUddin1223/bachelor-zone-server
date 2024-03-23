import express from 'express';
import { verifyAdmin } from '../../utils/jwtHelpers/verifyAuth';
import { adminController } from './admin.controller';

const router = express.Router();

router.route('/add-category').post(verifyAdmin, adminController.addCategory);
router.route('/add-quiz/:id').post(verifyAdmin, adminController.addQuiz);
router.route('/get-statics').get(verifyAdmin, adminController.getStatics);

export default { adminRouter: router };
