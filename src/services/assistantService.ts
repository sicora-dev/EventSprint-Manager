import { fetchJson } from './httpClient';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const sendAssistantMessage = async ({ messages, accessToken }) => {
  return fetchJson(
    `${API_BASE_URL}/ai/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        messages
      })
    },
    'No se pudo contactar al asistente'
  );
};
