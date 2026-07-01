const express = require('express');
const router = express.Router();
const { 
  getSprintsByProject, 
  createSprint, 
  updateSprint, 
  deleteSprint 
} = require('../controllers/sprintController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/project/:projectId')
  .get(getSprintsByProject)
  .post(createSprint);

router.route('/:sprintId')
  .put(updateSprint)
  .delete(deleteSprint);

module.exports = router;
