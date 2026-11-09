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

  // Sempre iniciar o aplicativo deslogado
  useEffect(() => {
    const initialize = async () => {
      try {
        // Remove qualquer sessão salva anteriormente
        await authService.logout();
      } catch (error) {
        console.log('Session initialization failed:', error.message);
      } finally {
        setUser(null);
        setToken(null);
        setFirstAccess(false);
        setInitializing(false);
      }
    };

    initialize();
  }, []);

  // Login
  const login = async (email, password) => {
    const result = await authService.login(email, password);

    setUser(result.user);
    setToken(result.token);
    setFirstAccess(result.user.firstAccess);
  };

  // Finalizar primeiro acesso após cadastrar endereço
  const completeFirstAccess = () => {
    setFirstAccess(false);

    setUser(prev =>
      prev ? { ...prev, firstAccess: false } : prev
    );
  };

  // Logout
  const logout = async () => {
    await authService.logout();

    setToken(null);
    setUser(null);
    setFirstAccess(false);
  };

  // Atualizar token
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
