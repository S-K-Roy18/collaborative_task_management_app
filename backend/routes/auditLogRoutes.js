const express = require('express');
const router = express.Router();
const { createAuditLog, getAuditLogs, getAuditLog, updateAuditLog, deleteAuditLog } = require('../controllers/auditLogController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createAuditLog)
  .get(getAuditLogs);

router.route('/:id')
  .get(getAuditLog)
  .put(updateAuditLog)
  .delete(deleteAuditLog);

module.exports = router;
