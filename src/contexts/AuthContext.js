
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  authService,
  getTokenData,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [firstAccess, setFirstAccess] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await authService.getToken();

        if (savedToken) {
          const decoded = getTokenData(savedToken);

          setToken(savedToken);
          setUser(decoded);
          setFirstAccess(decoded.firstAccess);
        }
      } catch (error) {
        console.log('Session restore failed:', error.message);
        await authService.logout();
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);

    setUser(result.user);
    setToken(result.token);
    setFirstAccess(result.user.firstAccess);
  };

  const completeFirstAccess = () => {
    setFirstAccess(false);

    setUser(prev =>
      prev ? { ...prev, firstAccess: false } : prev
    );
  };

  const logout = async () => {
    await authService.logout();

    setToken(null);
    setUser(null);
    setFirstAccess(false);
  };

  const updateSession = async (newToken) => {
    const result = await authService.updateToken(newToken);

    setToken(result.token);
    setUser(result.user);
    setFirstAccess(result.user.firstAccess);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        firstAccess,
        initializing,
        isAuthenticated: !!token,
        login,
        logout,
        updateSession,
        completeFirstAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth requires AuthProvider');
  }

  return context;
}
