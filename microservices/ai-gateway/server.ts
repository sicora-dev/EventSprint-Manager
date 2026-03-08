import cors from 'cors';
import express from 'express';
import { aiChatHandler } from '../../server/handlers/aiChatHandler';
import { getServerConfig } from '../../server/lib/config';

const config = getServerConfig();
const app = express();

app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((item) => item.trim()),
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'ai-gateway',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/ai/chat', aiChatHandler);

app.use((error, _req, res, _next) => {
  res.status(500).json({
    error: error.message || 'Internal server error'
  });
});

app.listen(config.microservicePort, () => {
  console.log(`AI gateway running on http://localhost:${config.microservicePort}`);
});
