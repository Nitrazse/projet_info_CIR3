import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>Tableau de bord</h1>
      <p>Bienvenue, {user?.nom} 👋</p>
      {/* TODO : KPIs, projets récents, notifications */}
    </div>
  );
}
