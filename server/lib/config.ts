import 'dotenv/config';

const readValue = (value) => (value ? String(value).trim() : '');

export const getServerConfig = () => {
  return {
    appName: process.env.VITE_APP_NAME || 'EventSprint Manager',
    appPublicUrl: process.env.APP_PUBLIC_URL || 'http://localhost:5173',
    microservicePort: Number(process.env.MICROSERVICE_PORT || 8787),
    corsOrigin: process.env.CORS_ORIGIN || '*',
    openRouterApiKey: readValue(process.env.OPENROUTER_API_KEY),
    openRouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
    supabaseUrl: readValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    supabaseAnonKey: readValue(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)
  };
};

export const assertConfigValues = (pairs) => {
  for (const [key, value] of pairs) {
    if (!value || !String(value).trim()) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
};
