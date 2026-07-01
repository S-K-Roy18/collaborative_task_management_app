const express = require('express');
const router = express.Router();
const { createOrganization, getOrganizations, getOrganization, updateOrganization, deleteOrganization } = require('../controllers/organizationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createOrganization)
  .get(getOrganizations);

const { getMyOrganizations, joinOrganization } = require('../controllers/organizationController');
router.get('/my-organizations', getMyOrganizations);
router.post('/join', joinOrganization);

router.route('/:id')
  .get(getOrganization)
  .put(updateOrganization)
  .delete(deleteOrganization);

module.exports = router;
