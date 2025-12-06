import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import VotingPage from './pages/VotingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreateVotingPage from './pages/CreateVotingPage';
import MyVotingsPage from './pages/MyVotingsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import VerificationPage from './pages/VerificationPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route 
              path="vote/:id" 
              element={
                <ProtectedRoute>
                  <VotingPage />
                </ProtectedRoute>
              } 
            />
            <Route path="about" element={<AboutPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route 
              path="create-voting" 
              element={
                <ProtectedRoute>
                  <CreateVotingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="my-votings" 
              element={
                <ProtectedRoute>
                  <MyVotingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="verify" 
              element={
                <ProtectedRoute>
                  <VerificationPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
