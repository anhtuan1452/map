import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  username: string;
  is_staff: boolean;
  is_superuser: boolean;
  email: string;
  role?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const savedUsername = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole') || 'student';
    
    console.log('[AuthContext] Init - username:', savedUsername, 'role:', userRole);
    
    if (token && savedUsername) {
      setIsAuthenticated(true);
      setUser({
        username: savedUsername,
        is_staff: userRole === 'teacher' || userRole === 'super_admin',
        is_superuser: userRole === 'super_admin',
        email: '',
        role: userRole
      });
    }
  }, []);

  const login = (token: string, userData: User) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    console.log('[AuthContext] Logging out, clearing localStorage');
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUser(null);
    // Force refresh to clear all state
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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