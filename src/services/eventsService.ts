import { hasSupabaseEnv, supabase } from '../lib/supabaseClient';

const ensureConfigured = () => {
  if (!hasSupabaseEnv) {
    throw new Error('Supabase no está configurado. Revisa el archivo .env');
  }
};

const baseSelect = `
  id,
  owner_id,
  title,
  description,
  location,
  event_date,
  status,
  priority,
  created_at,
  updated_at,
  profiles:owner_id ( display_name, email )
`;

export const getEvents = async ({ isAdmin, userId }) => {
  ensureConfigured();

  let query = supabase.from('event_tasks').select(baseSelect).order('event_date', { ascending: true });

  if (!isAdmin) {
    query = query.eq('owner_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
};

export const createEvent = async (payload) => {
  ensureConfigured();

  const { data, error } = await supabase.from('event_tasks').insert(payload).select(baseSelect).single();

  if (error) {
    throw error;
  }

  return data;
};

export const replaceEvent = async (eventId, payload) => {
  ensureConfigured();

  const { data, error } = await supabase
    .from('event_tasks')
    .update(payload)
    .eq('id', eventId)
    .select(baseSelect)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const patchEvent = async (eventId, partialPayload) => {
  ensureConfigured();

  const { data, error } = await supabase
    .from('event_tasks')
    .update(partialPayload)
    .eq('id', eventId)
    .select(baseSelect)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteEvent = async (eventId) => {
  ensureConfigured();

  const { error } = await supabase.from('event_tasks').delete().eq('id', eventId);

  if (error) {
    throw error;
  }
};
