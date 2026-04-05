import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TestInterface from './pages/TestInterface';
import ResultsPage from './pages/ResultsPage';
import ReviewPage from './pages/ReviewPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/test/:id" element={<TestInterface />} />
        <Route path="/results/:id" element={<ResultsPage />} />
        <Route path="/review/:id" element={<ReviewPage />} />
      </Routes>
    </Router>
  );
}

export default App;
