import { Router } from 'express';
import { fetchPRData } from '../services/github.js';

const router = Router();

// POST /api/github/pr — fetch PR diff and metadata
// SECURITY: Token is used for the request only, never logged or stored
router.post('/pr', async (req, res) => {
  const { owner, repo, pullNumber, token } = req.body;

  if (!owner || !repo || !pullNumber) {
    return res.status(400).json({
      error: 'Missing required fields: owner, repo, and pullNumber are required',
    });
  }

  try {
    const prData = await fetchPRData(owner, repo, parseInt(pullNumber), token);
    res.json(prData);
  } catch (error) {
    console.error('GitHub fetch error:', error.message);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message,
    });
  }
});

export default router;
