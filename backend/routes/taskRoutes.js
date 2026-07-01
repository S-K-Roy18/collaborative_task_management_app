const express = require('express');
const router = express.Router();
const { createTask, getTasks, getTask, updateTask, deleteTask, getTasksByWorkspace, addAttachment, removeAttachment } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createTask)
  .get(getTasks);

router.get('/workspace/:workspaceId', getTasksByWorkspace);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

router.post('/:id/attachments', addAttachment);
router.delete('/:id/attachments/:attachmentId', removeAttachment);

module.exports = router;
