import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import VotingPage from './pages/VotingPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="vote/:id" element={<VotingPage />} />
          {/* Add more routes here later, e.g., <Route path="about" element={<AboutPage />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
