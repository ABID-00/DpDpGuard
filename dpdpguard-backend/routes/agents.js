const express = require('express');
const router = express.Router();
const {
  getAllAgents,
  registerAgent,
  submitEvidence,
  getAgentById,
  updateAgentStatus,
  disableAgent,
  rotateApiKey
} = require('../controllers/agentController');
const { auth, agentAuth } = require('../middleware/auth');

// Agent registration (no auth needed)
router.post('/register', registerAgent);

// Evidence submission (requires API key)
router.post('/evidence', submitEvidence);

// Protected routes
router.get('/', auth, getAllAgents);
router.get('/:id', auth, getAgentById);
router.put('/:id/status', auth, updateAgentStatus);
router.put('/:id/disable', auth, disableAgent);
router.post('/:id/rotate-key', auth, rotateApiKey);

module.exports = router;
