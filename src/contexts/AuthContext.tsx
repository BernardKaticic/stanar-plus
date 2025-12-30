import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type UserRole = 'admin' | 'upravitelj' | 'stanar';

interface MockUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthContextType {
  user: MockUser | null;
  session: any;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users
const MOCK_USERS = [
  { 
    id: '1', 
    email: 'admin@stanar.hr', 
    password: 'admin123',
    role: 'admin' as UserRole,
    user_metadata: { full_name: 'Ivan Horvat' }
  },
  { 
    id: '2', 
    email: 'upravitelj@stanar.hr', 
    password: 'upravitelj123',
    role: 'upravitelj' as UserRole,
    user_metadata: { full_name: 'Marko Marić' }
  },
  { 
    id: '3', 
    email: 'stanar@stanar.hr', 
    password: 'stanar123',
    role: 'stanar' as UserRole,
    user_metadata: { full_name: 'Ana Kovač' }
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData.user);
      setUserRole(userData.role);
      setSession({ user: userData.user });
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (!mockUser) {
      return { error: { message: 'Invalid login credentials' } };
    }

    const userData = {
      user: {
        id: mockUser.id,
        email: mockUser.email,
        user_metadata: mockUser.user_metadata,
      },
      role: mockUser.role,
    };

    localStorage.setItem('mock_user', JSON.stringify(userData));
    setUser(userData.user);
    setUserRole(userData.role);
    setSession({ user: userData.user });
    navigate('/');
    
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user already exists
    const exists = MOCK_USERS.find(u => u.email === email);
    if (exists) {
      return { error: { message: 'User already registered' } };
    }

    const userData = {
      user: {
        id: Math.random().toString(36).substr(2, 9),
        email,
        user_metadata: { full_name: fullName },
      },
      role: 'stanar' as UserRole,
    };

    localStorage.setItem('mock_user', JSON.stringify(userData));
    setUser(userData.user);
    setUserRole(userData.role);
    setSession({ user: userData.user });
    navigate('/');
    
    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem('mock_user');
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
