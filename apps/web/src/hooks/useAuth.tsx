import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser, LoginInput, LoginResponse } from '@admissions-hub/shared';
import { apiFetch, setUnauthorizedHandler, tokenStore } from '../api/client';

type AuthState = {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(tokenStore.get);

  const me = useQuery({
    queryKey: ['me', token],
    queryFn: () => apiFetch<AuthUser>('/auth/me'),
    enabled: token !== null,
    retry: false,
    staleTime: Infinity,
  });

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  const login = useCallback(
    async (input: LoginInput) => {
      const { token: newToken, user } = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: input,
      });
      tokenStore.set(newToken);
      queryClient.setQueryData(['me', newToken], user);
      setToken(newToken);
    },
    [queryClient],
  );

  const value = useMemo<AuthState>(() => {
    const user = token ? (me.data ?? null) : null;
    const status = !token || me.isError ? 'anonymous' : user ? 'authenticated' : 'loading';
    return { user, status, login, logout };
  }, [token, me.data, me.isError, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>');
  return auth;
}
