import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import VotingPage from './pages/VotingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreateVotingPage from './pages/CreateVotingPage';
import MyVotingsPage from './pages/MyVotingsPage';
import MyCreatedVotingsPage from './pages/MyCreatedVotingsPage';
import ManageVotesPage from './pages/ManageVotesPage';
import ProfilePage from './pages/ProfilePage';
// import SettingsPage from './pages/SettingsPage'; // Keeping existing if needed, but not in routes
// import VerificationPage from './pages/VerificationPage'; // Removed as we use modal now
import { IotaProvider } from './context/IotaProvider';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import './App.css';

function App() {
  return (
    <IotaProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              
              <Route path="create" element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <CreateVotingPage />
                </ProtectedRoute>
              } />
              
              <Route path="vote/:id" element={
                <ProtectedRoute>
                  <VotingPage />
                </ProtectedRoute>
              } />
              
              <Route path="my-votings" element={
                <ProtectedRoute allowedRoles={['voter']}>
                  <MyVotingsPage />
                </ProtectedRoute>
              } />
              
              <Route path="my-created" element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <MyCreatedVotingsPage />
                </ProtectedRoute>
              } />
              
              <Route path="manage-votes/:eventId" element={
                <ProtectedRoute allowedRoles={['organizer']}>
                  <ManageVotesPage />
                </ProtectedRoute>
              } />
              
              <Route path="profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </IotaProvider>
  );
}

export default App;
