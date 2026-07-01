const express = require('express');
const router = express.Router();
const { createWorkspace, getWorkspaces, getWorkspace, updateWorkspace, deleteWorkspace } = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createWorkspace)
  .get(getWorkspaces);

const { getMyWorkspaces, addMember } = require('../controllers/workspaceController');
router.get('/my-workspaces', getMyWorkspaces);
router.post('/:id/members', addMember);

router.route('/:id')
  .get(getWorkspace)
  .put(updateWorkspace)
  .delete(deleteWorkspace);

module.exports = router;
