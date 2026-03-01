import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  authLogin,
  authRegister,
  authLogout,
  authMe,
  getStoredSession,
  setStoredTokens,
  clearSession,
} from '../lib/api';

type UserRole = 'admin' | 'upravitelj' | 'stanar';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
  organization_id?: string | null;
  organization_name?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const stored = getStoredSession();
      if (!stored?.accessToken) {
        setLoading(false);
        return;
      }
      try {
        const data = await authMe();
        setUser(data.user);
        setUserRole(data.role as UserRole);
        setSession({ user: data.user });
      } catch {
        clearSession();
        setUser(null);
        setUserRole(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authLogin(email, password);
      setStoredTokens(data.accessToken, data.refreshToken, data.user, data.role, data.organization_name);
      setUser(data.user);
      setUserRole(data.role as UserRole);
      setSession({ user: data.user });
      navigate('/');
      return { error: null };
    } catch (err: any) {
      const message =
        err?.body?.message ||
        err?.message ||
        'Neuspjela prijava. Provjerite email i lozinku.';
      return { error: { message } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const data = await authRegister(email, password, fullName);
      setStoredTokens(
        data.accessToken,
        data.refreshToken,
        data.user,
        data.role,
        data.organization_name
      );
      setUser(data.user);
      setUserRole(data.role as UserRole);
      setSession({ user: data.user });
      navigate('/');
      return { error: null };
    } catch (err: any) {
      const message =
        err?.body?.message ||
        err?.message ||
        'Greška pri registraciji. Pokušajte ponovno.';
      return { error: { message } };
    }
  };

  const signOut = async () => {
    await authLogout();
    setUser(null);
    setUserRole(null);
    setSession(null);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
