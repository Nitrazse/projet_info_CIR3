import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Deliverables from './pages/Deliverables';
import Evaluation from './pages/Evaluation';
import EncadrantDashboard from './pages/EncadrantDashboard';
import EncadrantProjet from './pages/EncadrantProjet';
import EncadrantLivrables from './pages/EncadrantLivrables';
import EncadrantEvaluation from './pages/EncadrantEvaluation';
import EncadrantProjets from './pages/EncadrantProjets';
import ProjetDetail from './pages/ProjetDetail';

// Protège les routes : redirige vers /login si non connecté
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Page d'accueil publique */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />

          {/* Routes protégées — toutes dans le layout avec sidebar */}
          <Route
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/deliverables" element={<Deliverables />} />
            <Route path="/evaluation" element={<Evaluation />} />
            {/* Routes encadrant */}
            <Route path="/encadrant/dashboard" element={<EncadrantDashboard />} />
            <Route path="/encadrant/projets/:id" element={<EncadrantProjet />} />
            <Route path="/encadrant/livrables" element={<EncadrantLivrables />} />
            <Route path="/encadrant/evaluation" element={<EncadrantEvaluation />} />
            <Route path="/encadrant/projets" element={<EncadrantProjets />} />
            <Route path="/projects/:id" element={<ProjetDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
