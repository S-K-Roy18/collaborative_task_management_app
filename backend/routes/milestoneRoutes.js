const express = require('express');
const router = express.Router();
const { createMilestone, getMilestones, getMilestone, updateMilestone, deleteMilestone } = require('../controllers/milestoneController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createMilestone)
  .get(getMilestones);

router.route('/:id')
  .get(getMilestone)
  .put(updateMilestone)
  .delete(deleteMilestone);

module.exports = router;
