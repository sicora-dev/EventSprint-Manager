import { createClient } from '@supabase/supabase-js';
import { assertConfigValues, getServerConfig } from './config';

const baseSelect =
  'id, owner_id, title, description, location, event_date, status, priority, created_at, updated_at';

interface EventQueryOptions {
  status?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export const createUserScopedClient = (accessToken: string) => {
  if (!accessToken) {
    throw new Error('Falta token de sesion del usuario');
  }

  const config = getServerConfig();
  assertConfigValues([
    ['VITE_SUPABASE_URL', config.supabaseUrl],
    ['VITE_SUPABASE_ANON_KEY', config.supabaseAnonKey]
  ]);

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
};

export const getUserIdFromToken = async (client: any) => {
  const { data, error } = await client.auth.getUser();

  if (error || !data?.user?.id) {
    throw new Error('Sesion invalida. Inicia sesion de nuevo.');
  }

  return data.user.id;
};

export const listScopedEvents = async (client: any, { status, fromDate, toDate, limit = 25 }: EventQueryOptions = {}) => {
  let query = client.from('event_tasks').select(baseSelect).order('event_date', { ascending: true }).limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  if (fromDate) {
    query = query.gte('event_date', fromDate);
  }

  if (toDate) {
    query = query.lte('event_date', toDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message || 'No se pudieron listar los eventos');
  }

  return data || [];
};

export const createScopedEvent = async (client: any, payload: Record<string, unknown>) => {
  const { data, error } = await client.from('event_tasks').insert(payload).select(baseSelect).single();

  if (error) {
    throw new Error(error.message || 'No se pudo crear el evento');
  }

  return data;
};

export const updateScopedEvent = async (client: any, eventId: string, changes: Record<string, unknown>) => {
  const { data, error } = await client
    .from('event_tasks')
    .update(changes)
    .eq('id', eventId)
    .select(baseSelect)
    .single();

  if (error) {
    throw new Error(error.message || 'No se pudo actualizar el evento');
  }

  return data;
};

export const deleteScopedEvent = async (client: any, eventId: string) => {
  const { error } = await client.from('event_tasks').delete().eq('id', eventId);

  if (error) {
    throw new Error(error.message || 'No se pudo eliminar el evento');
  }

  return { success: true };
};

export const findScopedEventByTitle = async (client: any, titleContains: string) => {
  const { data, error } = await client
    .from('event_tasks')
    .select(baseSelect)
    .ilike('title', `%${titleContains}%`)
    .order('event_date', { ascending: true })
    .limit(3);

  if (error) {
    throw new Error(error.message || 'No se pudo buscar el evento por titulo');
  }

  const rows = data || [];

  if (!rows.length) {
    throw new Error('No se encontro ningun evento que coincida con ese titulo');
  }

  if (rows.length > 1) {
    const list = rows.map((item) => `${item.title} (${item.id})`).join(' | ');
    throw new Error(`Hay varios eventos similares. Especifica mejor: ${list}`);
  }

  return rows[0];
};
