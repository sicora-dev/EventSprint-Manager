import { aiChatHandler } from '../../server/handlers/aiChatHandler';

const parseBody = (rawBody) => {
  if (!rawBody) {
    return {};
  }

  if (typeof rawBody === 'string') {
    try {
      return JSON.parse(rawBody);
    } catch {
      return {};
    }
  }

  return rawBody;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  req.body = parseBody(req.body);
  await aiChatHandler(req, res);
}
