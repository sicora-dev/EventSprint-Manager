import { create } from 'zustand';
import {
  ensureProfile,
  fetchProfile,
  getSession,
  listenAuthChanges,
  resolveRole,
  signIn,
  signOut,
  signUp
} from '../services/authService';

type AuthRole = 'guest' | 'user' | 'admin';

interface AuthStore {
  session: any;
  user: any;
  profile: any;
  role: AuthRole;
  isBootstrapping: boolean;
  authListenerReady: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  applySession: (session: any) => Promise<AuthRole>;
  bootstrap: () => Promise<void>;
  prepareAuthListener: () => () => void;
  login: (payload: { email: string; password: string }) => Promise<AuthRole>;
  register: (payload: { email: string; password: string; displayName: string }) => Promise<AuthRole | 'pending_confirmation'>;
  logout: () => Promise<void>;
}

const anonymousState: Pick<AuthStore, 'session' | 'user' | 'profile' | 'role'> = {
  session: null,
  user: null,
  profile: null,
  role: 'guest'
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...anonymousState,
  isBootstrapping: true,
  authListenerReady: false,
  error: null,

  setError: (error) => set({ error }),

  applySession: async (session) => {
    if (!session?.user) {
      set({ ...anonymousState, error: null });
      return 'guest';
    }

    const profileFromDb = await fetchProfile(session.user.id);
    const profile = profileFromDb || (await ensureProfile(session.user));
    const role = resolveRole(profile);

    set({
      session,
      user: session.user,
      profile,
      role,
      error: null
    });

    return role;
  },

  bootstrap: async () => {
    set({ isBootstrapping: true });

    try {
      const session = await getSession();
      await get().applySession(session);
    } catch (error) {
      set({ ...anonymousState, error: error.message });
    } finally {
      set({ isBootstrapping: false });
    }
  },

  prepareAuthListener: () => {
    if (get().authListenerReady) {
      return () => undefined;
    }

    let unsubscribe = () => undefined;

    try {
      unsubscribe = listenAuthChanges(async (session) => {
        try {
          await get().applySession(session);
        } catch (error) {
          set({ ...anonymousState, error: error.message });
        }
      });
    } catch (error) {
      set({ ...anonymousState, error: error.message });
      return () => undefined;
    }

    set({ authListenerReady: true });
    return unsubscribe;
  },

  login: async ({ email, password }) => {
    const session = await signIn({ email, password });
    return get().applySession(session);
  },

  register: async ({ email, password, displayName }) => {
    const session = await signUp({ email, password, displayName });

    if (!session?.user) {
      return 'pending_confirmation';
    }

    return get().applySession(session);
  },

  logout: async () => {
    await signOut();
    set({ ...anonymousState, error: null });
  }
}));
