import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  signInUser,
  signInWithGoogle,
  signOutUser,
  listenForAuthStateChange,
  isAdminUser,
  getAccessibleClinics,
  ALL_CLINICS
} from '../services/auth';
import type { UserData } from '../services/auth';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  accessibleClinics: string[];
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenForAuthStateChange((authData) => {
      if (authData) {
        setCurrentUser(authData.user);
        setUserData(authData.userData);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

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

  const isAdmin = userData
    ? userData.role === 'owner' || userData.role === 'admin' || userData.role === 'boss'
    : currentUser
      ? isAdminUser(currentUser.email || '')
      : false;

  const accessibleClinics = (() => {
    if (userData) {
      if (userData.role === 'owner' || userData.role === 'boss') {
        return ALL_CLINICS;
      }
      if (userData.clinics?.length) {
        return userData.clinics;
      }
    }
    if (currentUser) {
      return getAccessibleClinics(currentUser.email || '');
    }
    return [];
  })();

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signIn,
    signInGoogle,
    signOut,
    isAdmin,
    accessibleClinics
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
