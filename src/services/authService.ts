import { hasSupabaseEnv, supabase } from '../lib/supabaseClient';

const ensureConfigured = () => {
  if (!hasSupabaseEnv) {
    throw new Error(
      'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, reinicia bun run dev y en Vercel vuelve a desplegar tras guardar variables.'
    );
  }
};

export const resolveRole = (profile) => (profile?.role === 'admin' ? 'admin' : 'user');

export const getSession = async () => {
  ensureConfigured();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
};

export const listenAuthChanges = (callback) => {
  ensureConfigured();
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
};

export const signIn = async ({ email, password }) => {
  ensureConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return data.session;
};

export const signUp = async ({ email, password, displayName }) => {
  ensureConfigured();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });

  if (error) {
    throw error;
  }

  return data.session;
};

export const signOut = async () => {
  ensureConfigured();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};

export const fetchProfile = async (userId) => {
  ensureConfigured();

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const ensureProfile = async (user) => {
  ensureConfigured();

  const draftProfile = {
    id: user.id,
    email: user.email,
    display_name: user.user_metadata?.display_name || user.email,
    role: 'user'
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(draftProfile, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
};
