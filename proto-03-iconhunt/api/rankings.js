import { validatePlayerId, validateScore } from '../lib/ranking.js';
import { fetchTopRankings, submitRanking } from '../lib/rankingStore.js';
import { hasSupabaseConfig } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (!hasSupabaseConfig()) {
    return res.status(503).json({ error: 'Ranking storage is not configured' });
  }

  try {
    if (req.method === 'GET') {
      const entries = await fetchTopRankings();
      return res.status(200).json(entries);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, score } = body ?? {};

      if (!validatePlayerId(id) || !validateScore(score)) {
        return res.status(400).json({ error: 'Invalid id or score' });
      }

      const entries = await submitRanking(id, score);
      return res.status(200).json(entries);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('rankings api error', error);
    return res.status(500).json({ error: 'Failed to process ranking request' });
  }
}
