import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { streamReview, getAvailableProviders } from '../services/llm.js';
import { createReview, listReviews, getReview, deleteReview, updateReviewResult } from '../db/database.js';

const router = Router();

// POST /api/review — SSE streaming code review
router.post('/', async (req, res) => {
  const { code, diff, language, source, provider, apiKey, title } = req.body;

  if (!code && !diff) {
    return res.status(400).json({ error: 'Code or diff content is required' });
  }

  if (!provider) {
    return res.status(400).json({ error: 'LLM provider is required' });
  }

  if (!apiKey) {
    return res.status(400).json({ error: `API key for ${provider} is required. Configure it in Settings.` });
  }

  const reviewId = uuidv4();
  const content = diff || code;
  const reviewSource = source || (diff ? 'github' : 'paste');
  const preview = content.substring(0, 200);
  const reviewTitle = title || `Review ${new Date().toLocaleDateString()}`;

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send review ID immediately
  res.write(`data: ${JSON.stringify({ type: 'start', reviewId })}\n\n`);

  try {
    // Create a placeholder review entry
    createReview({
      id: reviewId,
      title: reviewTitle,
      source: reviewSource,
      language: language || 'plaintext',
      provider,
      score: null,
      fileCount: 1,
      preview,
      code: source === 'github' ? null : code,
      diff: diff || null,
      reviewJson: null,
    });

    // Stream the LLM response
    const reviewResult = await streamReview(
      content,
      language,
      reviewSource,
      provider,
      apiKey,
      (token) => {
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      }
    );

    // Update the review with final result
    updateReviewResult(reviewId, reviewResult, reviewResult.score);

    // Send final result
    res.write(`data: ${JSON.stringify({ type: 'complete', reviewId, review: reviewResult })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Review error:', error.message);

    // Clean up the placeholder
    try { deleteReview(reviewId); } catch {}

    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// GET /api/review/providers
router.get('/providers', (req, res) => {
  res.json({ providers: getAvailableProviders() });
});

// GET /api/review/history
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const reviews = listReviews(limit, offset);
    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review history' });
  }
});

// GET /api/review/:id
router.get('/:id', (req, res) => {
  try {
    const review = getReview(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ review });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// DELETE /api/review/:id
router.delete('/:id', (req, res) => {
  try {
    const result = deleteReview(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
