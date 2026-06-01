import { createContext, useContext, useState } from 'react';

// Rôles disponibles dans la plateforme
export const ROLES = {
  ETUDIANT: 'etudiant',
  TEAM_LEADER: 'team_leader',
  ENCADRANT: 'encadrant',
  JURY: 'jury',
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // TODO: retirer le mock avant la mise en prod
  const DEV_MOCK = import.meta.env.VITE_DEV_MOCK === 'true';
  const [user, setUser] = useState(
    DEV_MOCK ? { id: 'mock-id', nom: 'Encadrant Test', email: 'test@test.com', role: 'encadrant' } : null
  );

  function login(userData, token) {
    localStorage.setItem('token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  function hasRole(...roles) {
    return user ? roles.includes(user.role) : false;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook raccourci pour consommer le contexte
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
