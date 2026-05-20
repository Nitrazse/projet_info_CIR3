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
  const [user, setUser] = useState(null); // { id, nom, email, role }

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
