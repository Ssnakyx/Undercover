import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  ApiError,
  apiLogin,
  apiLogout,
  apiMe,
  apiRegister,
  apiSetPhoto,
  getAccountToken,
  setAccountToken,
  type Account,
  type AccountStats,
} from '../lib/account';

/** 'loading' : jeton présent, profil en cours de chargement. 'offline' : jeton présent mais
 * serveur injoignable (il se réveille) — on garde la session. 'guest' : pas de compte. */
type AccountStatus = 'loading' | 'ready' | 'offline' | 'guest';

interface AccountContextValue {
  status: AccountStatus;
  account: Account | null;
  stats: AccountStats | null;
  register: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setPhoto: (dataUrl: string | null) => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AccountStatus>(() => (getAccountToken() ? 'loading' : 'guest'));
  const [account, setAccount] = useState<Account | null>(null);
  const [stats, setStats] = useState<AccountStats | null>(null);

  const refresh = useCallback(async () => {
    const token = getAccountToken();
    if (!token) {
      setStatus('guest');
      setAccount(null);
      setStats(null);
      return;
    }
    try {
      const me = await apiMe(token);
      setAccount(me.account);
      setStats(me.stats);
      setStatus('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAccountToken(null);
        setAccount(null);
        setStats(null);
        setStatus('guest');
      } else {
        setStatus('offline');
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signedIn = useCallback(
    async (res: { token: string; account: Account }) => {
      setAccountToken(res.token);
      setAccount(res.account);
      setStatus('ready');
      await refresh();
    },
    [refresh]
  );

  const register = useCallback(async (u: string, p: string) => signedIn(await apiRegister(u, p)), [signedIn]);
  const login = useCallback(async (u: string, p: string) => signedIn(await apiLogin(u, p)), [signedIn]);

  const logout = useCallback(async () => {
    const token = getAccountToken();
    setAccountToken(null);
    setAccount(null);
    setStats(null);
    setStatus('guest');
    if (token) await apiLogout(token).catch(() => {});
  }, []);

  const setPhoto = useCallback(async (dataUrl: string | null) => {
    const token = getAccountToken();
    if (!token) return;
    const res = await apiSetPhoto(token, dataUrl);
    setAccount(res.account);
    // Le siège en room garde l'ancienne version de photo : on le rattache à nouveau.
    setAccountToken(token);
  }, []);

  return (
    <AccountContext.Provider value={{ status, account, stats, register, login, logout, refresh, setPhoto }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount doit être utilisé sous <AccountProvider>');
  return ctx;
}
