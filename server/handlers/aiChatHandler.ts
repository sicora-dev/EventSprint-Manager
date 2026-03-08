import { OpenRouter, fromChatMessages, stepCountIs } from '@openrouter/sdk';
import { createAssistantTools } from '../lib/assistantTools';
import { assertConfigValues, getServerConfig } from '../lib/config';
import { sanitizeChatMessages } from '../lib/messageSanitizer';
import { createUserScopedClient, getUserIdFromToken } from '../lib/supabaseUserClient';

const systemInstructions = `
Eres un asistente operativo integrado en una app de gestion de eventos.
Ayuda al usuario a consultar y gestionar sus eventos con acciones concretas.

Reglas:
- Usa herramientas cuando necesites datos o acciones sobre eventos.
- Si falta informacion para modificar datos, pide un dato breve y preciso.
- Resume cada accion realizada y su resultado.
- Nunca inventes IDs o resultados de herramientas.
`;

const toContentString = (value) => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item?.type === 'text' && typeof item?.text === 'string') {
          return item.text;
        }

        return '';
      })
      .join('\n')
      .trim();
  }

  return '';
};

const buildClient = (config) =>
  new OpenRouter({
    apiKey: config.openRouterApiKey,
    httpReferer: config.appPublicUrl,
    xTitle: config.appName
  });

export const aiChatHandler = async (req, res) => {
  try {
    const config = getServerConfig();
    assertConfigValues([['OPENROUTER_API_KEY', config.openRouterApiKey]]);

    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!accessToken) {
      res.status(401).json({ error: 'Sesion requerida para usar el asistente' });
      return;
    }

    const userClient = createUserScopedClient(accessToken);
    const userId = await getUserIdFromToken(userClient);

    const activityLog = [];
    const mutationState = { hasMutations: false };

    const tools = createAssistantTools({
      client: userClient,
      userId,
      activityLog,
      mutationState
    });

    const safeMessages = sanitizeChatMessages(req.body?.messages || []);

    if (!safeMessages.length) {
      res.status(400).json({ error: 'No se recibieron mensajes validos' });
      return;
    }

    const chatInput = fromChatMessages([
      { role: 'system', content: systemInstructions },
      ...safeMessages
    ]);

    const client = buildClient(config);

    const modelResult = client.callModel({
      model: config.openRouterModel,
      input: chatInput,
      tools,
      temperature: 0.2,
      stopWhen: stepCountIs(6)
    });

    const reply = (await modelResult.getText()) || 'No tengo una respuesta util en este momento.';
    const rawResponse = await modelResult.getResponse();

    const usage = {
      inputTokens: rawResponse.usage?.inputTokens || null,
      outputTokens: rawResponse.usage?.outputTokens || null,
      totalTokens: rawResponse.usage?.totalTokens || null
    };

    res.status(200).json({
      reply: toContentString(reply),
      activity: activityLog,
      mutatedData: mutationState.hasMutations,
      usage
    });
  } catch (error) {
    const message = error?.message || 'No se pudo procesar la solicitud del asistente';
    const statusCode = message.includes('Sesion invalida') ? 401 : 400;

    res.status(statusCode).json({ error: message });
  }
};
