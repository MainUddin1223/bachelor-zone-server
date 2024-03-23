import express from 'express';
import { verifyAuth, verifyPerformer } from '../../utils/jwtHelpers/verifyAuth';
import { performerController } from './performer.controller';

const router = express.Router();

router.route('/categories').get(performerController.getCategories);
router.route('/leader-board').get(performerController.getLeaderBoard);
router.route('/my-tests').get(verifyAuth, performerController.getMyTests);
router
  .route('/my-tests/:id')
  .get(verifyPerformer, performerController.getMyTestById)
  .patch(verifyPerformer, performerController.completeTest);

router
  .route('/request-test/:id')
  .post(verifyPerformer, performerController.createQuizTest);
router
  .route('/my-statics')
  .get(verifyPerformer, performerController.getStatics);
router
  .route('/verify-answer/:id')
  .patch(verifyPerformer, performerController.verifyAnswer);

export default { performerRouter: router };
