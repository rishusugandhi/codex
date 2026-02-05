import { analyzeWithOpenAI } from '../lib/openai-analyzer.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const input = String(req.body?.input || '').trim();
    if (!input) {
      return res.status(400).json({ error: 'Input is required.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'Server missing OPENAI_API_KEY. Add it in Vercel project environment variables.',
      });
    }

    const tasks = await analyzeWithOpenAI(input, process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4o-mini');
    return res.status(200).json({ tasks });
  } catch (error) {
    return res.status(500).json({
      error: 'Could not analyze tasks. Try again.',
      details: error.message,
    });
  }
}
