import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import {
  signUpUser,
  signInUser,
  signInWithGoogle,
  signOutUser,
  listenForAuthStateChange,
  isAdminUser
} from '../services/auth';
import type { UserData } from '../services/auth';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  authReady: boolean;
  signUp: (email: string, password: string, additionalInfo?: Partial<UserData>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  requestAuthInit: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [initRequested, setInitRequested] = useState(false);
  const location = useLocation();

  const requestAuthInit = useCallback(() => {
    setInitRequested(true);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/app')) {
      setInitRequested(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!initRequested) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenForAuthStateChange((authData) => {
      if (authData) {
        setCurrentUser(authData.user);
        setUserData(authData.userData);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setAuthInitialized(true);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      setAuthInitialized(false);
    };
  }, [initRequested]);

  const signUp = async (email: string, password: string, additionalInfo?: Partial<UserData>) => {
    const { user, userData: newUserData } = await signUpUser(email, password, additionalInfo);
    setCurrentUser(user);
    setUserData(newUserData);
  };

  const signIn = async (email: string, password: string) => {
    const { user, userData: fetchedUserData } = await signInUser(email, password);
    setCurrentUser(user);
    setUserData(fetchedUserData);
  };

  const signInGoogle = async () => {
    const { user, userData: fetchedUserData } = await signInWithGoogle();
    setCurrentUser(user);
    setUserData(fetchedUserData);
  };

  const signOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setUserData(null);
  };

  const isAdmin = currentUser ? isAdminUser(currentUser.email || '') : false;

  const value: AuthContextType = {
    currentUser,
    userData,
    loading: initRequested ? loading : false,
    authReady: !initRequested || authInitialized,
    signUp,
    signIn,
    signInGoogle,
    signOut,
    isAdmin,
    requestAuthInit
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
