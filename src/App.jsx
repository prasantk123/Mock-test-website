import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TestInterface from './pages/TestInterface';
import ResultsPage from './pages/ResultsPage';
import ReviewPage from './pages/ReviewPage';
import LoginPage from './pages/LoginPage';
import { UserProvider, useUser } from './context/UserContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/test/:id" element={
            <ProtectedRoute>
              <TestInterface />
            </ProtectedRoute>
          } />
          <Route path="/results/:id" element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          } />
          <Route path="/review/:id" element={
            <ProtectedRoute>
              <ReviewPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
