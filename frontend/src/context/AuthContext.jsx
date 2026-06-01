import { createContext, useContext, useState } from 'react';

export const ROLES = {
  ETUDIANT: 'etudiant',
  TEAM_LEADER: 'team_leader',
  ENCADRANT: 'encadrant',
  JURY: 'jury',
};

const AuthContext = createContext(null);

// Relit le user depuis le token JWT stocké en localStorage
function getUserFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return null;
    }
    return {
      id:    payload.sub,
      email: payload.email,
      nom:   payload.user_metadata?.nom,
      role:  payload.user_metadata?.role ?? 'etudiant',
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUserFromToken());

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
